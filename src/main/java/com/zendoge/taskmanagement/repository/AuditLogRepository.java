package com.zendoge.taskmanagement.repository;

import com.zendoge.taskmanagement.domain.AuditLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
	List<AuditLog> findByUserId(Long userId);
}
