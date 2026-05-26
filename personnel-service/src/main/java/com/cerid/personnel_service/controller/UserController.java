package com.cerid.personnel_service.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cerid.personnel_service.config.RabbitMQConfig;
import com.cerid.personnel_service.entity.User;
import com.cerid.personnel_service.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/personnel/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    @lombok.Getter
    @lombok.Setter
    public static class UserRequest {
        private String username;
        private String password;
        private String role;
        private List<Long> supervisorIds;
        private Boolean hasPurchasingAuthority; // YENİ: Finans Yetkisi
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable Long id) {
        User u = userRepository.findById(id).orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));
        Map<String, Object> map = new HashMap<>();
        map.put("id", u.getId());
        map.put("username", u.getUsername());
        map.put("hasPurchasingAuthority", u.getHasPurchasingAuthority()); // YENİ
        return ResponseEntity.ok(map);
    }

    @GetMapping("/my-subordinates")
    public ResponseEntity<List<Map<String, Object>>> getMySubordinates(@RequestParam Long supervisorId) {
        List<User> users = userRepository.findBySupervisorsId(supervisorId);
        List<Map<String, Object>> safeList = new ArrayList<>();
        for(User u : users) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            safeList.add(map);
        }
        return ResponseEntity.ok(safeList);
    }

    @GetMapping("/all-users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        List<User> users = userRepository.findAll(); 
        List<Map<String, Object>> safeList = new ArrayList<>();
        for(User u : users) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            safeList.add(map);
        }
        return ResponseEntity.ok(safeList);
    }

    @GetMapping("/admin/all")
    public ResponseEntity<List<Map<String, Object>>> getAllUsersForAdmin() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for(User u : users) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("role", u.getRole() != null ? u.getRole().name() : "WORKER");
            map.put("hasPurchasingAuthority", u.getHasPurchasingAuthority()); // YENİ: Listede gösterilmesi için eklendi

            List<Long> supIds = new ArrayList<>();
            if (u.getSupervisors() != null) {
                for(User s : u.getSupervisors()) {
                    supIds.add(s.getId());
                }
            }
            map.put("supervisorIds", supIds);
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/admin/create")
    public ResponseEntity<?> createUser(@RequestBody UserRequest request) {
        User newUser = new User();
        newUser.setUsername(request.getUsername());
        newUser.setPasswordHash(request.getPassword());
        newUser.setRole(com.cerid.personnel_service.entity.enums.Role.valueOf(request.getRole()));
        
        // YENİ: Finans Yetkisi Kaydı (Admin'se zorunlu true, değilse formdan gelen değer)
        boolean auth = "ADMIN".equals(request.getRole()) ? true : (request.getHasPurchasingAuthority() != null && request.getHasPurchasingAuthority());
        newUser.setHasPurchasingAuthority(auth);

        if ("WORKER".equals(request.getRole()) && request.getSupervisorIds() != null && !request.getSupervisorIds().isEmpty()) {
            List<User> supervisors = userRepository.findAllById(request.getSupervisorIds());
            newUser.setSupervisors(supervisors);
        }
        userRepository.save(newUser);
        return ResponseEntity.ok(java.util.Collections.singletonMap("message", "Kullanıcı oluşturuldu"));
    }

    @PutMapping("/admin/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UserRequest request) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));
        existing.setUsername(request.getUsername());
        existing.setRole(com.cerid.personnel_service.entity.enums.Role.valueOf(request.getRole()));
        
        // YENİ: Finans Yetkisi Güncelleme
        boolean auth = "ADMIN".equals(request.getRole()) ? true : (request.getHasPurchasingAuthority() != null && request.getHasPurchasingAuthority());
        existing.setHasPurchasingAuthority(auth);

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            existing.setPasswordHash(request.getPassword()); 
        }
        if ("WORKER".equals(request.getRole()) && request.getSupervisorIds() != null && !request.getSupervisorIds().isEmpty()) {
            List<User> supervisors = userRepository.findAllById(request.getSupervisorIds());
            existing.setSupervisors(supervisors);
        } else {
            existing.getSupervisors().clear();
        }
        userRepository.save(existing);
        return ResponseEntity.ok(java.util.Collections.singletonMap("message", "Kullanıcı güncellendi"));
    }

    @org.springframework.transaction.annotation.Transactional
    @DeleteMapping("/admin/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        User userToDelete = userRepository.findById(id).orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));
        if (userToDelete.getSupervisors() != null) userToDelete.getSupervisors().clear();
        if (userToDelete.getSubordinates() != null) {
            for (User subordinate : userToDelete.getSubordinates()) {
                subordinate.getSupervisors().remove(userToDelete);
                userRepository.save(subordinate);
            }
        }
        userRepository.delete(userToDelete);
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, RabbitMQConfig.ROUTING_KEY, id);
        return ResponseEntity.ok(java.util.Collections.singletonMap("message", "Kullanıcı başarıyla silindi"));
    }
}