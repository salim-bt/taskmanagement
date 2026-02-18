package com.zendoge.taskmanagement.service;

import com.zendoge.taskmanagement.domain.Task;
import com.zendoge.taskmanagement.domain.TaskStatus;
import com.zendoge.taskmanagement.domain.User;
import com.zendoge.taskmanagement.domain.UserRole;
import com.zendoge.taskmanagement.repository.TaskRepository;
import com.zendoge.taskmanagement.repository.UserRepository;
import com.zendoge.taskmanagement.web.dto.TaskCreateRequest;
import com.zendoge.taskmanagement.web.dto.TaskResponse;
import com.zendoge.taskmanagement.web.dto.TaskUpdateRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TaskService {
	private final TaskRepository taskRepository;
	private final UserRepository userRepository;
	private final AuditService auditService;

	public TaskService(TaskRepository taskRepository, UserRepository userRepository, AuditService auditService) {
		this.taskRepository = taskRepository;
		this.userRepository = userRepository;
		this.auditService = auditService;
	}

	public List<TaskResponse> listTasks() {
		User currentUser = requireCurrentUser();
		List<Task> tasks = currentUser.getRole() == UserRole.MEMBER
			? taskRepository.findByAssigneeId(currentUser.getId())
			: taskRepository.findAll();
		return tasks.stream().map(this::toResponse).toList();
	}

	public TaskResponse create(TaskCreateRequest request) {
		User currentUser = requireCurrentUser();
		Task task = new Task();
		task.setTitle(request.title());
		task.setDescription(request.description());
		task.setStatus(TaskStatus.TODO);
		task.setCreatedBy(currentUser);
		if (request.assigneeId() != null) {
			User assignee = userRepository.findById(request.assigneeId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignee not found"));
			task.setAssignee(assignee);
		}
		Task saved = taskRepository.save(task);
		auditService.log(currentUser, "CREATE", "TASK", saved.getId(), null, snapshot(saved));
		return toResponse(saved);
	}

	public TaskResponse update(Long id, TaskUpdateRequest request) {
		User currentUser = requireCurrentUser();
		Task task = taskRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
		Map<String, Object> before = snapshot(task);

		boolean changed = false;

		if (currentUser.getRole() == UserRole.VIEWER) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Viewers have read-only access");
		}

		if (currentUser.getRole() == UserRole.MEMBER) {
			validateMemberAccess(currentUser, task);
			if (request.title() != null || request.description() != null || request.assigneeId() != null) {
				throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Members can only update status");
			}
			if (request.status() != null && !request.status().equals(task.getStatus())) {
				validateMemberTransition(task.getStatus(), request.status());
				task.setStatus(request.status());
				changed = true;
			}
			
			if (changed) {
				Task saved = taskRepository.save(task);
				auditService.log(currentUser, "UPDATE", "TASK", saved.getId(), before, snapshot(saved));
				return toResponse(saved);
			}
			return toResponse(task);
		}

		if (request.title() != null && !request.title().equals(task.getTitle())) {
			task.setTitle(request.title());
			changed = true;
		}
		if (request.description() != null && !request.description().equals(task.getDescription())) {
			task.setDescription(request.description());
			changed = true;
		}
		if (request.status() != null && !request.status().equals(task.getStatus())) {
			task.setStatus(request.status());
			changed = true;
		}
		if (request.assigneeId() != null) {
			Long currentAssigneeId = task.getAssignee() != null ? task.getAssignee().getId() : null;
			if (!request.assigneeId().equals(currentAssigneeId)) {
				User assignee = userRepository.findById(request.assigneeId())
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignee not found"));
				task.setAssignee(assignee);
				changed = true;
			}
		}

		if (changed) {
			Task saved = taskRepository.save(task);
			auditService.log(currentUser, "UPDATE", "TASK", saved.getId(), before, snapshot(saved));
			return toResponse(saved);
		}
		return toResponse(task);
	}

	public void delete(Long id) {
		User currentUser = requireCurrentUser();
		Task task = taskRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
		auditService.log(currentUser, "DELETE", "TASK", task.getId(), snapshot(task), null);
		taskRepository.delete(task);
	}

	private User requireCurrentUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || authentication.getName() == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No authenticated user");
		}
		return userRepository.findByEmail(authentication.getName())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
	}

	private void validateMemberAccess(User currentUser, Task task) {
		if (task.getAssignee() == null || !task.getAssignee().getId().equals(currentUser.getId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Task not assigned to current user");
		}
	}

	private void validateMemberTransition(TaskStatus current, TaskStatus next) {
		if (next == null) {
			return;
		}
		boolean allowed = (current == TaskStatus.TODO && next == TaskStatus.DOING)
			|| (current == TaskStatus.DOING && next == TaskStatus.DONE);
		if (!allowed) {
			throw new ResponseStatusException(
				HttpStatus.UNPROCESSABLE_ENTITY,
				"Invalid status transition for member"
			);
		}
	}

	private TaskResponse toResponse(Task task) {
		Long assigneeId = task.getAssignee() != null ? task.getAssignee().getId() : null;
		return new TaskResponse(
			task.getId(),
			task.getTitle(),
			task.getDescription(),
			task.getStatus(),
			assigneeId,
			task.getCreatedBy().getId(),
			task.getCreatedAt()
		);
	}

	private Map<String, Object> snapshot(Task task) {
		Map<String, Object> data = new HashMap<>();
		data.put("id", task.getId());
		data.put("title", task.getTitle());
		data.put("description", task.getDescription());
		data.put("status", task.getStatus());
		data.put("assigneeId", task.getAssignee() != null ? task.getAssignee().getId() : null);
		data.put("createdById", task.getCreatedBy() != null ? task.getCreatedBy().getId() : null);
		data.put("createdAt", task.getCreatedAt());
		return data;
	}
}
