package com.zendoge.taskmanagement.web.dto;

import java.time.Instant;

public record AuditLogResponse(
	Long id,
	Long userId,
	String action,
	String entity,
	Long entityId,
	String oldData,
	String newData,
	Instant timestamp
) {
}
