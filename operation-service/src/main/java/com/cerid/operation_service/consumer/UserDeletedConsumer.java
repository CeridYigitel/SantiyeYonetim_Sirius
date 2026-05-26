package com.cerid.operation_service.consumer;

import java.util.List;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.cerid.operation_service.config.RabbitMQConfig;
import com.cerid.operation_service.entity.ConstructionSite;
import com.cerid.operation_service.repository.ConstructionSiteRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class UserDeletedConsumer {

    private final ConstructionSiteRepository siteRepository;

    @RabbitListener(queues = RabbitMQConfig.QUEUE)
    public void handleUserDeletedEvent(Long deletedUserId) {
        System.out.println("===============> [RABBITMQ CONSUMER] Silinen Kullanıcı Mesajı Alındı! Gelen ID: " + deletedUserId);

        try {
            List<ConstructionSite> allSites = siteRepository.findAll();
            boolean isUpdated = false;

            for (ConstructionSite site : allSites) {
                if (site.getWorkerIds() != null) {
                    
                    // KRİTİK DÜZELTME: "contains" veya "remove(Object)" kullanmıyoruz!
                    // Long ve Integer tipleri birbirine karışsa bile longValue() ile değerlerini kıyaslayıp siliyoruz.
                    boolean removed = site.getWorkerIds().removeIf(workerId -> workerId.longValue() == deletedUserId.longValue());
                    
                    if (removed) {
                        System.out.println("-----> " + site.getName() + " şantiyesinden işçi temizlendi. İşçi ID: " + deletedUserId);
                        siteRepository.save(site);
                        isUpdated = true;
                    }
                }
            }
            
            if (isUpdated) {
                System.out.println("===============> [RABBITMQ CONSUMER] Şantiyelerdeki işçi temizliği başarıyla bitti.");
            }
            
        } catch (Exception e) {
            System.out.println("❌ [RABBITMQ CONSUMER] Temizlik işlemi esnasında hata oluştu: " + e.getMessage());
            e.printStackTrace();
        }
    }
}