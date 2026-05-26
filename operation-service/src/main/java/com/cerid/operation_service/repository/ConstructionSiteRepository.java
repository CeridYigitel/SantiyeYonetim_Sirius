package com.cerid.operation_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cerid.operation_service.entity.ConstructionSite;

public interface ConstructionSiteRepository extends JpaRepository<ConstructionSite, Long> {
}