package com.zendoge.taskmanagement.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zendoge.taskmanagement.domain.AuditLog;
import com.zendoge.taskmanagement.domain.User;
import com.zendoge.taskmanagement.repository.AuditLogRepository;
import com.zendoge.taskmanagement.repository.UserRepository;
import com.zendoge.taskmanagement.web.dto.AuditLogResponse;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuditService {
	private final AuditLogRepository auditLogRepository;
	private final UserRepository userRepository;
	private final ObjectMapper objectMapper;

	public AuditService(
		AuditLogRepository auditLogRepository,
		UserRepository userRepository,
		ObjectMapper objectMapper
	) {
		this.auditLogRepository = auditLogRepository;
		this.userRepository = userRepository;
		this.objectMapper = objectMapper;
	}

	public void log(User user, String action, String entity, Long entityId, Object oldData, Object newData) {
		AuditLog log = new AuditLog();
		log.setUser(user);
		log.setAction(action);
		log.setEntity(entity);
		log.setEntityId(entityId);
		log.setOldData(writeJson(oldData));
		log.setNewData(writeJson(newData));
		auditLogRepository.save(log);
	}

	public List<AuditLogResponse> listAll() {
		return auditLogRepository.findAll().stream().map(this::toResponse).toList();
	}

	public List<AuditLogResponse> listForCurrentUser() {
		User user = requireCurrentUser();
		return listByUser(user.getId());
	}

	public List<AuditLogResponse> listByUser(Long userId) {
		return auditLogRepository.findByUserId(userId).stream().map(this::toResponse).toList();
	}

	private String writeJson(Object value) {
		if (value == null) {
			return null;
		}
		try {
			return objectMapper.writeValueAsString(value);
		} catch (JsonProcessingException ex) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to serialize audit payload");
		}
	}

	private AuditLogResponse toResponse(AuditLog log) {
		return new AuditLogResponse(
			log.getId(),
			log.getUser().getId(),
			log.getAction(),
			log.getEntity(),
			log.getEntityId(),
			log.getOldData(),
			log.getNewData(),
			log.getTimestamp()
		);
	}

	private User requireCurrentUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || authentication.getName() == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No authenticated user");
		}
		return userRepository.findByEmail(authentication.getName())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
	}
}
