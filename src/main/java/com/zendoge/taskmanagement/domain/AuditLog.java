package com.zendoge.taskmanagement.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
public class AuditLog {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(nullable = false, length = 100)
	private String action;

	@Column(nullable = false, length = 100)
	private String entity;

	@Column(name = "entity_id", nullable = false)
	private Long entityId;

	@Column(name = "old_data", columnDefinition = "text")
	private String oldData;

	@Column(name = "new_data", columnDefinition = "text")
	private String newData;

	@Column(nullable = false)
	private Instant timestamp;

	@PrePersist
	void onCreate() {
		if (timestamp == null) {
			timestamp = Instant.now();
		}
	}
}
