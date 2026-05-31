<?php

declare(strict_types=1);

const OT_TIMELINE_STEPS = [
    'PO_CREATED',
    'SUPPLIER_ACCEPTED',
    'PRODUCTION_STARTED',
    'PACKED',
    'DISPATCHED',
    'IN_TRANSIT',
    'DELIVERED',
    'GRN_GENERATED',
    'INVOICE_SUBMITTED',
    'PAYMENT_COMPLETED',
];

const OT_PROGRESS_MAP = [
    'PO_CREATED' => 10,
    'SUPPLIER_ACCEPTED' => 20,
    'PRODUCTION_STARTED' => 35,
    'PACKED' => 45,
    'DISPATCHED' => 60,
    'IN_TRANSIT' => 75,
    'DELIVERED' => 90,
    'GRN_GENERATED' => 92,
    'INVOICE_SUBMITTED' => 96,
    'PAYMENT_COMPLETED' => 100,
];

const OT_SUPPLIER_ACTIONS = [
    'accept' => ['status' => 'SUPPLIER_ACCEPTED', 'label' => 'Accept PO'],
    'start_production' => ['status' => 'PRODUCTION_STARTED', 'label' => 'Start Production'],
    'mark_packed' => ['status' => 'PACKED', 'label' => 'Mark Packed'],
    'mark_dispatched' => ['status' => 'DISPATCHED', 'label' => 'Mark Dispatched'],
    'mark_in_transit' => ['status' => 'IN_TRANSIT', 'label' => 'Mark In Transit'],
    'mark_delivered' => ['status' => 'DELIVERED', 'label' => 'Mark Delivered'],
];

function ot_progress_for_status(string $status): int
{
    return OT_PROGRESS_MAP[$status] ?? 10;
}

function ot_po_status_for_tracking(string $trackingStatus): string
{
    return match ($trackingStatus) {
        'SUPPLIER_ACCEPTED', 'PRODUCTION_STARTED', 'PACKED' => 'pending',
        'DISPATCHED', 'IN_TRANSIT' => 'shipped',
        'DELIVERED', 'GRN_GENERATED', 'INVOICE_SUBMITTED' => 'delivered',
        'PAYMENT_COMPLETED' => 'fulfilled',
        default => 'issued',
    };
}

function ot_status_label(string $status): string
{
    return ucwords(strtolower(str_replace('_', ' ', $status)));
}

function ot_next_supplier_action(string $currentStatus): ?array
{
    $flow = ['PO_CREATED', 'SUPPLIER_ACCEPTED', 'PRODUCTION_STARTED', 'PACKED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'];
    $idx = array_search($currentStatus, $flow, true);
    if ($idx === false || $idx >= count($flow) - 1) {
        return null;
    }
    $nextStatus = $flow[$idx + 1];
    foreach (OT_SUPPLIER_ACTIONS as $action => $meta) {
        if ($meta['status'] === $nextStatus) {
            return ['action' => $action, 'label' => $meta['label'], 'status' => $nextStatus];
        }
    }
    return null;
}

function ot_build_timeline(array $events): array
{
    $completed = [];
    foreach ($events as $event) {
        $completed[$event['status']] = $event;
    }

    $currentStatus = 'PO_CREATED';
    if (!empty($events)) {
        $last = end($events);
        $currentStatus = $last['status'];
    }

    $currentIdx = array_search($currentStatus, OT_TIMELINE_STEPS, true);
    if ($currentIdx === false) {
        $currentIdx = 0;
    }

    $timeline = [];
    foreach (OT_TIMELINE_STEPS as $idx => $step) {
        $event = $completed[$step] ?? null;
        if ($event) {
            $state = 'completed';
        } elseif ($idx === $currentIdx + 1 && $currentIdx < count(OT_TIMELINE_STEPS) - 1) {
            $state = 'active';
        } else {
            $state = 'pending';
        }

        $timeline[] = [
            'status' => $step,
            'label' => ot_status_label($step),
            'state' => $state,
            'description' => $event['description'] ?? null,
            'created_at' => $event['created_at'] ?? null,
            'updated_by_name' => $event['updated_by_name'] ?? null,
        ];
    }

    return $timeline;
}

function ot_action_description(string $status, string $poNumber): string
{
    return match ($status) {
        'SUPPLIER_ACCEPTED' => "Supplier accepted purchase order {$poNumber}.",
        'PRODUCTION_STARTED' => 'Production started for ordered items.',
        'PACKED' => 'Order packed and ready for dispatch.',
        'DISPATCHED' => 'Shipment dispatched to carrier.',
        'IN_TRANSIT' => 'Shipment in transit to destination.',
        'DELIVERED' => 'Order delivered to buyer location.',
        'GRN_GENERATED' => 'Goods receipt note generated.',
        'INVOICE_SUBMITTED' => 'Supplier invoice submitted for payment.',
        'PAYMENT_COMPLETED' => 'Payment completed — order closed.',
        default => "Purchase order {$poNumber} created and issued.",
    };
}

function ot_audit_action_for_status(string $status): string
{
    return match ($status) {
        'SUPPLIER_ACCEPTED' => 'SUPPLIER_ACCEPTED_PO',
        'DISPATCHED' => 'SUPPLIER_DISPATCHED_SHIPMENT',
        'DELIVERED' => 'SUPPLIER_DELIVERED_SHIPMENT',
        default => 'ORDER_TRACKING_UPDATED',
    };
}
