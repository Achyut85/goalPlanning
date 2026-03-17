const request = require("supertest");

// mock the service to avoid real API calls during tests
jest.mock("../services/goalPlanning.js", () => {
    return jest.fn().mockImplementation((data) => {
        // behave like validation: reject empty body
        if (!data || Object.keys(data).length === 0) {
            const err = new Error("Input validation failed");
            err.details = [];
            return Promise.reject(err);
        }
        return Promise.resolve({
            mock: true,
            received: data,
        });
    });
});

const app = require("../server");

// simple smoke test for the /api/goal-planning endpoint

describe("API integration tests", () => {
    it("should return 400 when payload is missing", async () => {
        const res = await request(app).post("/api/goal-planning").send({});
        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/Input validation/i);
    });

    it("should return 200 with a well-formed body", async () => {
        const payload = {
            goal_meta: { goal_name: "Retirement", time_horizon_years: 25 },
            retirement_inputs: {
                current_age: 35,
                retirement_age: 60,
                life_expectancy: 85,
                target_monthly_income_required_today: 80000,
            },
            user_financial_profile: {
                monthly_income: 200000,
                monthly_expenses: 120000,
                current_savings: 1500000,
                emergency_fund_months: 6,
                risk_profile: "Moderate",
            },
            loan_profile: {
                has_loan: true,
                total_outstanding_loan: 1000000,
                total_monthly_emi: 25000,
            },
        };

        const res = await request(app).post("/api/goal-planning").send(payload);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
        // further assertions could verify shape of returned data
    });
});
