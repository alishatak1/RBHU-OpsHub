const BASE_URL = "http://localhost:5000/api";

let passed = 0;
let failed = 0;
let token = null;

async function request(path, method = "GET", body = undefined, authenticated = true) {
    const headers = {};

    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    if (authenticated && token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const options = { method, headers };

    if (body !== undefined) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${path}`, options);
    const text = await response.text();

    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    return { status: response.status, data };
}

function check(name, condition, details = "") {
    if (condition) {
        console.log(`PASS: ${name}`);
        passed++;
    } else {
        console.log(`FAIL: ${name} ${details}`);
        failed++;
    }
}

function getRecordId(data) {
    return data?.id ??
        data?.customer?.id ??
        data?.shipment?.id ??
        data?.data?.id;
}

async function runTests() {
    console.log("\nRBHU OpsHub API Tests\n");

    // 1. Health check
    const health = await request("/health", "GET", undefined, false);
    check("API health check", health.status === 200);

    // 2. Verify protected route rejects unauthenticated access
    const unauthorized = await request("/customers", "GET", undefined, false);
    check("Reject unauthenticated customer access", unauthorized.status === 401);

    // 3. Admin login
    const login = await request("/auth/login", "POST", {
        email: process.env.RBHU_TEST_EMAIL,
        password: process.env.RBHU_TEST_PASSWORD
    }, false);

    token = login.data?.token;
    check("Admin login", login.status === 200 && !!token,
        `Status: ${login.status}`);

    if (!token) {
        console.log("Login failed. Check the admin credentials.");
        process.exitCode = 1;
        return;
    }

    // 4. Verify authenticated admin
    const currentAdmin = await request("/auth/me");
    check("Get current admin", currentAdmin.status === 200);

    const unique = Date.now();
    const email = `api.test.${unique}@example.com`;

    // 5. Create customer
    const customer = await request("/customers", "POST", {
        name: "API Test Customer",
        email,
        phone: "+919999999999",
        company: "RBHU Test Company"
    });

    const customerId = getRecordId(customer.data);
    check("Create customer", customer.status === 201 && !!customerId,
        `Status: ${customer.status}`);

    if (!customerId) {
        console.log("Could not obtain customer ID. Stopping dependent tests.");
        return;
    }

    // 6. Retrieve customer
    const getCustomer = await request(`/customers/${customerId}`);
    check("Retrieve customer", getCustomer.status === 200);

    // 7. Update customer
    const updateCustomer = await request(`/customers/${customerId}`, "PUT", {
        name: "API Test Customer Updated",
        email,
        phone: "+919999999999",
        company: "RBHU Test Company"
    });
    check("Update customer", updateCustomer.status === 200);

    // 8. Create shipment
    const trackingNumber = `API-TEST-${unique}`;
    const shipment = await request("/shipments", "POST", {
        trackingNumber,
        origin: "Mumbai",
        destination: "Pune",
        customerId
    });

    const shipmentId = getRecordId(shipment.data);
    check("Create shipment", shipment.status === 201 && !!shipmentId,
        `Status: ${shipment.status}`);

    if (shipmentId) {
        // 9. Retrieve shipment
        const getShipment = await request(`/shipments/${shipmentId}`);
        check("Retrieve shipment", getShipment.status === 200);

        // 10. Update shipment status
        const updateStatus = await request(
            `/shipments/${shipmentId}/status`,
            "PATCH",
            { status: "IN_TRANSIT" }
        );
        check("Update shipment status", updateStatus.status === 200);

        // 11. Reject invalid status
        const invalidStatus = await request(
            `/shipments/${shipmentId}/status`,
            "PATCH",
            { status: "INVALID_STATUS" }
        );
        check("Reject invalid shipment status", invalidStatus.status >= 400);
    }

    // 12. Reject duplicate tracking number
    const duplicate = await request("/shipments", "POST", {
        trackingNumber,
        origin: "Mumbai",
        destination: "Pune",
        customerId
    });
    check("Reject duplicate tracking number", duplicate.status === 409);

    // 13. Soft-delete temporary customer
    const deleteCustomer = await request(`/customers/${customerId}`, "DELETE");
    check("Soft-delete customer",
        deleteCustomer.status >= 200 && deleteCustomer.status < 300);

    // 14. Confirm deleted customer is unavailable
    const deletedCustomer = await request(`/customers/${customerId}`);
    check("Deleted customer is unavailable", deletedCustomer.status === 404);

    console.log("\n------------------------------");
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log("------------------------------");

    if (failed > 0) process.exitCode = 1;
}

runTests().catch(error => {
    console.error("Test script error:", error);
    process.exitCode = 1;
});
