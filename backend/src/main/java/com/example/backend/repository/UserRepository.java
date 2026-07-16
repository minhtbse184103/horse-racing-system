package com.example.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.example.backend.entity.User;
import jakarta.persistence.LockModeType;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Optional<User> findByPhone(String phone);

    boolean existsByUsername(String username);

    boolean existsByPhone(String phone);

    List<User> findByStatusAndRoleRoleNameOrderByUpdatedAtDesc(String status, String roleName);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.userID = :userId")
    Optional<User> findByIdForUpdate(@Param("userId") Integer userId);
}
