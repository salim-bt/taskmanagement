package com.zendoge.taskmanagement.web.dto;

import com.zendoge.taskmanagement.domain.TaskStatus;
import jakarta.validation.constraints.Size;

public record TaskUpdateRequest(
	@Size(max = 200) String title,
	String description,
	TaskStatus status,
	Long assigneeId
) {
}
