<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/src/Database.php';
require_once dirname(__DIR__) . '/src/Http.php';
require_once dirname(__DIR__) . '/src/RfqService.php';

use Srm\Http;
use Srm\RfqService;

Http::sendCors();

if (Http::method() === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $service = new RfqService();
    $service->seedIfEmpty();
} catch (Throwable $e) {
    Http::error($e->getMessage(), 500);
    exit;
}

$method = Http::method();
$path = Http::path();

if (!str_starts_with($path, '/api')) {
    Http::json(['ok' => true, 'message' => 'SRM RFQ API (PHP + MySQL)', 'docs' => '/api/health']);
    exit;
}

try {
    route($method, $path, $service);
} catch (Throwable $e) {
    Http::error($e->getMessage(), 500);
}

function route(string $method, string $path, RfqService $service): void
{
    if ($method === 'GET' && $path === '/api/health') {
        Http::json($service->health());
        return;
    }

    if ($method === 'GET' && $path === '/api/rfq-state') {
        $state = $service->getState();
        Http::json(['ok' => true, ...$state]);
        return;
    }

    if ($method === 'GET' && $path === '/api/rfqs') {
        $visibility = $_GET['visibility'] ?? null;
        Http::json(['ok' => true, 'rfqs' => $service->listRfqs($visibility)]);
        return;
    }

    if ($method === 'GET' && $path === '/api/bids') {
        $data = $service->listBids($_GET['supplier'] ?? null, $_GET['rfqId'] ?? null);
        Http::json(['ok' => true, ...$data]);
        return;
    }

    if ($method === 'POST' && $path === '/api/rfqs') {
        $outcome = $service->createRfq(Http::readJsonBody());
        if ($outcome['error']) {
            Http::error($outcome['error'], 400);
            return;
        }
        Http::json(['ok' => true, 'rfq' => $outcome['result']], 201);
        return;
    }

    if (preg_match('#^/api/rfqs/([^/]+)/bids/scored$#', $path, $m) && $method === 'GET') {
        Http::json(['ok' => true, 'bids' => $service->getScoredBidsForRfq($m[1])]);
        return;
    }

    if (preg_match('#^/api/rfqs/([^/]+)/bids$#', $path, $m) && $method === 'POST') {
        $outcome = $service->submitBid($m[1], Http::readJsonBody());
        if ($outcome['error']) {
            Http::error($outcome['error'], 400);
            return;
        }
        Http::json(['ok' => true, 'bid' => $outcome['result']], 201);
        return;
    }

    if (preg_match('#^/api/rfqs/([^/]+)/award$#', $path, $m) && $method === 'POST') {
        $body = Http::readJsonBody();
        $bidId = $body['bidId'] ?? '';
        if ($bidId === '') {
            Http::error('bidId is required.', 400);
            return;
        }
        $outcome = $service->awardBid($m[1], $bidId);
        if ($outcome['error']) {
            Http::error($outcome['error'], 400);
            return;
        }
        if ($outcome['result'] === null) {
            Http::error('RFQ or bid not found.', 404);
            return;
        }
        Http::json(['ok' => true, 'rfq' => $outcome['result']]);
        return;
    }

    if (preg_match('#^/api/rfqs/([^/]+)/status$#', $path, $m) && $method === 'PATCH') {
        $body = Http::readJsonBody();
        $status = $body['status'] ?? '';
        if ($status === '') {
            Http::error('status is required.', 400);
            return;
        }
        $outcome = $service->updateRfqStatus($m[1], $status);
        if ($outcome['error']) {
            Http::error($outcome['error'], 400);
            return;
        }
        if ($outcome['result'] === null) {
            Http::error('RFQ not found.', 404);
            return;
        }
        Http::json(['ok' => true, 'rfq' => $outcome['result']]);
        return;
    }

    if (preg_match('#^/api/rfqs/([^/]+)$#', $path, $m)) {
        $id = $m[1];

        if ($method === 'GET') {
            $detail = $service->getRfq($id);
            if ($detail === null) {
                Http::error('RFQ not found.', 404);
                return;
            }
            Http::json(['ok' => true, ...$detail]);
            return;
        }

        if ($method === 'PUT') {
            $outcome = $service->updateRfq($id, Http::readJsonBody());
            if ($outcome['error']) {
                Http::error($outcome['error'], 400);
                return;
            }
            if ($outcome['result'] === null) {
                Http::error('RFQ not found.', 404);
                return;
            }
            Http::json(['ok' => true, 'rfq' => $outcome['result']]);
            return;
        }

        if ($method === 'DELETE') {
            $outcome = $service->deleteRfq($id);
            if ($outcome['error']) {
                Http::error($outcome['error'], 400);
                return;
            }
            if (!$outcome['result']) {
                Http::error('RFQ not found or cannot be deleted.', 404);
                return;
            }
            Http::json(['ok' => true]);
            return;
        }
    }

    Http::error('Not found.', 404);
}
