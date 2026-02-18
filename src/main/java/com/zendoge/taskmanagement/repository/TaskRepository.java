package com.zendoge.taskmanagement.repository;

import com.zendoge.taskmanagement.domain.Task;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, Long> {
	List<Task> findByAssigneeId(Long assigneeId);
}
