package com.zendoge.taskmanagement.web.dto;

import com.zendoge.taskmanagement.domain.TaskStatus;
import java.time.Instant;

public record TaskResponse(
	Long id,
	String title,
	String description,
	TaskStatus status,
	Long assigneeId,
	Long createdById,
	Instant createdAt
) {
}
