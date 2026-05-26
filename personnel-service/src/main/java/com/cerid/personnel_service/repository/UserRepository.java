package com.cerid.personnel_service.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cerid.personnel_service.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    java.util.Optional<User> findByUsername(String username);
    
    // YENİ: Ustanın ID'sine göre ara tablodan işçilerini bulur (Spring bunu otomatik çözer)
    List<User> findBySupervisorsId(Long supervisorId);

    // YENİ: İşçi ile usta arasındaki bağ ara tabloda var mı kontrol eder
    boolean existsByIdAndSupervisorsId(Long workerId, Long supervisorId);
    
    // Varsa eski findBySupervisorId metotlarını silebilirsin.

}