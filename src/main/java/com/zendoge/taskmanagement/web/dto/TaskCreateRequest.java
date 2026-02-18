package com.zendoge.taskmanagement.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TaskCreateRequest(
	@NotBlank @Size(max = 200) String title,
	String description,
	Long assigneeId
) {
}
