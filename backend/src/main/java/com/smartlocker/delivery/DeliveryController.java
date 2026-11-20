package com.smartlocker.delivery;

import com.smartlocker.auth.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * API đơn giao nhận: Shipper tạo đơn cấp ngăn; Người nhận chỉ xem đơn của chính mình.
 */
@RestController
@RequestMapping("/api/deliveries")
public class DeliveryController {

    private final DeliveryService deliveryService;

    public DeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @PostMapping
    @PreAuthorize("hasRole('COURIER')")
    public ResponseEntity<DeliveryDtos.DeliveryResponse> createDelivery(
            @AuthenticationPrincipal User courier,
            @Valid @RequestBody DeliveryDtos.CreateDeliveryRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(deliveryService.allocateAndCreate(courier, request));
    }

    @GetMapping("/my")
    public List<DeliveryDtos.DeliveryResponse> myDeliveries(@AuthenticationPrincipal User currentUser) {
        return deliveryService.listForCurrentUser(currentUser);
    }

    @GetMapping("/{id}")
    public DeliveryDtos.DeliveryResponse getOne(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        return deliveryService.getByIdForUser(id, currentUser);
    }
}
