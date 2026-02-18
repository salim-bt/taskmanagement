package com.zendoge.taskmanagement.web;

import com.zendoge.taskmanagement.service.TaskService;
import com.zendoge.taskmanagement.web.dto.TaskCreateRequest;
import com.zendoge.taskmanagement.web.dto.TaskResponse;
import com.zendoge.taskmanagement.web.dto.TaskUpdateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
@Tag(name = "Tasks", description = "Task CRUD operations with role-based access")
public class TaskController {
	private final TaskService taskService;

	public TaskController(TaskService taskService) {
		this.taskService = taskService;
	}

	@GetMapping
	@Operation(summary = "List tasks", description = "ADMIN/MANAGER see all tasks. MEMBER sees only assigned tasks. VIEWER sees all (read-only).")
	@ApiResponse(responseCode = "200", description = "Tasks retrieved successfully")
	public List<TaskResponse> list() {
		return taskService.listTasks();
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
	@Operation(summary = "Create a task", description = "Creates a new task. Requires ADMIN or MANAGER role.")
	@ApiResponse(responseCode = "201", description = "Task created successfully")
	@ApiResponse(responseCode = "403", description = "Insufficient permissions")
	public TaskResponse create(@Valid @RequestBody TaskCreateRequest request) {
		return taskService.create(request);
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasAnyRole('ADMIN','MANAGER','MEMBER')")
	@Operation(summary = "Update a task", description = "Updates a task. ADMIN/MANAGER can update all fields. MEMBER can only update status of assigned tasks.")
	@ApiResponse(responseCode = "200", description = "Task updated successfully")
	@ApiResponse(responseCode = "403", description = "Insufficient permissions")
	@ApiResponse(responseCode = "404", description = "Task not found")
	public TaskResponse update(
		@Parameter(description = "Task ID") @PathVariable Long id,
		@Valid @RequestBody TaskUpdateRequest request
	) {
		return taskService.update(id, request);
	}

	@DeleteMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Delete a task", description = "Permanently deletes a task. Requires ADMIN role.")
	@ApiResponse(responseCode = "204", description = "Task deleted successfully")
	@ApiResponse(responseCode = "403", description = "Insufficient permissions")
	@ApiResponse(responseCode = "404", description = "Task not found")
	public void delete(@Parameter(description = "Task ID") @PathVariable Long id) {
		taskService.delete(id);
	}
}
