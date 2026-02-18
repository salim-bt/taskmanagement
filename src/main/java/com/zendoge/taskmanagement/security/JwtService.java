package com.zendoge.taskmanagement.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
	private final Key signingKey;
	private final long expirationMs;

	public JwtService(
		@Value("${security.jwt.secret}") String secret,
		@Value("${security.jwt.expiration-ms}") long expirationMs
	) {
		this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8));
		this.expirationMs = expirationMs;
	}

	public String generateToken(UserDetails userDetails) {
		Instant now = Instant.now();
		return Jwts.builder()
			.setSubject(userDetails.getUsername())
			.setIssuedAt(Date.from(now))
			.setExpiration(Date.from(now.plusMillis(expirationMs)))
			.signWith(signingKey, SignatureAlgorithm.HS256)
			.compact();
	}

	public String extractUsername(String token) {
		return parseClaims(token).getSubject();
	}

	public boolean isTokenValid(String token, UserDetails userDetails) {
		String username = extractUsername(token);
		return username.equals(userDetails.getUsername()) && !isExpired(token);
	}

	private boolean isExpired(String token) {
		Date expiration = parseClaims(token).getExpiration();
		return expiration.before(new Date());
	}

	private Claims parseClaims(String token) {
		return Jwts.parserBuilder()
			.setSigningKey(signingKey)
			.build()
			.parseClaimsJws(token)
			.getBody();
	}

}
