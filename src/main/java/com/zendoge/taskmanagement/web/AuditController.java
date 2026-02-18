package com.zendoge.taskmanagement.web;

import com.zendoge.taskmanagement.service.AuditService;
import com.zendoge.taskmanagement.web.dto.AuditLogResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit")
@Tag(name = "Audit Logs", description = "Audit trail for all entity changes")
public class AuditController {
	private final AuditService auditService;

	public AuditController(AuditService auditService) {
		this.auditService = auditService;
	}

	@GetMapping
	@PreAuthorize("hasRole('ADMIN')")
	@Operation(summary = "List all audit logs", description = "Returns the complete audit trail. Requires ADMIN role.")
	@ApiResponse(responseCode = "200", description = "Audit logs retrieved")
	@ApiResponse(responseCode = "403", description = "Insufficient permissions")
	public List<AuditLogResponse> list() {
		return auditService.listAll();
	}

	@GetMapping("/me")
	@PreAuthorize("hasAnyRole('ADMIN','MANAGER','MEMBER')")
	@Operation(summary = "List my audit logs", description = "Returns audit logs for the current user's actions. Requires ADMIN, MANAGER, or MEMBER role.")
	@ApiResponse(responseCode = "200", description = "User audit logs retrieved")
	@ApiResponse(responseCode = "403", description = "Insufficient permissions")
	public List<AuditLogResponse> listMine() {
		return auditService.listForCurrentUser();
	}
}
