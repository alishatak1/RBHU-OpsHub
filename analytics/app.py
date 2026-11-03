from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import plotly.express as px
import os
import json

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "RBHU OpsHub Analytics"
    })

@app.route("/analyze", methods=["POST"])
def analyze():
    if "file" not in request.files:
        return jsonify({"error": "Please upload a CSV file"}), 400

    file = request.files["file"]

    if not file.filename or not file.filename.lower().endswith(".csv"):
        return jsonify({"error": "Only CSV files are supported"}), 400

    try:
        df = pd.read_csv(file)

        required_columns = ["salesperson", "revenue", "region"]
        missing = [col for col in required_columns if col not in df.columns]

        if missing:
            return jsonify({
                "error": "Missing required columns",
                "missing_columns": missing
            }), 400

        df["revenue"] = pd.to_numeric(df["revenue"], errors="coerce")
        df = df.dropna(subset=["salesperson", "revenue", "region"])

        if df.empty:
            return jsonify({"error": "No valid sales records found"}), 400

        region_revenue = (
            df.groupby("region", as_index=False)["revenue"]
            .sum()
            .sort_values("revenue", ascending=False)
        )

        salesperson_revenue = (
            df.groupby("salesperson", as_index=False)["revenue"]
            .sum()
            .sort_values("revenue", ascending=False)
            .head(10)
        )

        region_chart = px.bar(
            region_revenue,
            x="region",
            y="revenue",
            title="Revenue by Region",
            labels={"revenue": "Revenue", "region": "Region"}
        )

        salesperson_chart = px.bar(
            salesperson_revenue,
            x="salesperson",
            y="revenue",
            title="Top 10 Salespeople",
            labels={"revenue": "Revenue", "salesperson": "Salesperson"}
        )

        summary = {
            "total_revenue": round(float(df["revenue"].sum()), 2),
            "average_revenue": round(float(df["revenue"].mean()), 2),
            "total_records": int(len(df)),
            "total_salespeople": int(df["salesperson"].nunique()),
            "total_regions": int(df["region"].nunique()),
            "highest_sale": round(float(df["revenue"].max()), 2)
        }

        return jsonify({
            "success": True,
            "summary": summary,
            "revenue_by_region": region_revenue.to_dict(orient="records"),
            "top_salespeople": salesperson_revenue.to_dict(orient="records"),
            "charts": {
                "region_chart": json.loads(region_chart.to_json()),
                "salesperson_chart": json.loads(salesperson_chart.to_json())
            }
        })

    except pd.errors.EmptyDataError:
        return jsonify({"error": "The uploaded CSV file is empty"}), 400
    except Exception as error:
        app.logger.exception("Analytics processing failed")
        return jsonify({"error": "Unable to analyze the uploaded file"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
