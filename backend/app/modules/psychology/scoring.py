from __future__ import annotations

from typing import Any

from app.modules.psychology.model import PsychologyMethod, PsychologyQuestion
from .schemas import AnswerItem


def _coerce_int(value: Any) -> int:
    """Convert raw answer value into an integer score. Non-numeric → 0."""
    if isinstance(value, bool):
        return 1 if value else 0
    if isinstance(value, (int, float)):
        return int(value)
    if isinstance(value, str):
        try:
            return int(float(value))
        except (TypeError, ValueError):
            return 0
    return 0


def _invert(value: int, question: PsychologyQuestion) -> int:
    """Invert score for reverse-keyed questions."""
    if question.question_type == "true_false":
        return 1 - value if value in (0, 1) else value
    if question.question_type == "scale":
        c = question.content or {}
        try:
            mn = int(c.get("min", 1))
            mx = int(c.get("max", 5))
        except (TypeError, ValueError):
            return value
        return (mn + mx) - value
    # text / image_* — no canonical max, leave as is
    return value


def _pick_interpretation(items: list[dict[str, Any]], score: int) -> dict[str, Any] | None:
    for item in items:
        try:
            mn = int(item.get("min"))
            mx = int(item.get("max"))
        except (TypeError, ValueError):
            continue
        if mn <= score <= mx:
            return {
                "label": str(item.get("label", "")),
                "description": str(item.get("description", "")),
            }
    return None


def compute_diagnosis(
    method: PsychologyMethod,
    answers: list[AnswerItem],
) -> dict[str, Any] | None:
    """
    Compute the diagnosis dict for the given method + answers.
    Returns None if `instruction` is not configured enough to interpret.
    """
    instruction = method.instruction or {}
    scoring = instruction.get("scoring") or {}
    if not scoring:
        return None

    score_method = scoring.get("method")
    reverse_orders = set(int(o) for o in (scoring.get("reverse") or []) if isinstance(o, (int, float)))

    questions_by_id = {q.id: q for q in method.questions}
    answers_by_qid = {a.question_id: a.value for a in answers}

    # Build scored map: question.order -> int score
    scored: dict[int, int] = {}
    for qid, raw_value in answers_by_qid.items():
        q = questions_by_id.get(qid)
        if not q:
            continue
        v = _coerce_int(raw_value)
        if q.order in reverse_orders:
            v = _invert(v, q)
        scored[q.order] = v

    if score_method == "sum":
        interpretation_items = instruction.get("interpretation") or []
        if not interpretation_items:
            return None
        total = sum(scored.values())
        match = _pick_interpretation(interpretation_items, total)
        if not match:
            return None
        return {
            "type": "sum",
            "total": total,
            "label": match["label"],
            "description": match["description"],
        }

    if score_method == "category":
        categories_map = scoring.get("categories") or {}
        cat_interpretations = instruction.get("category_interpretations") or {}
        if not categories_map or not cat_interpretations:
            return None

        # New path: if any question has `category` set, group by question.category.
        # Fallback: legacy `instruction.scoring.categories[name]: [order_numbers]` lists.
        use_question_category = any(
            (q.category or "").strip() for q in method.questions
        )
        orders_by_category: dict[str, list[int]] = {}
        if use_question_category:
            for q in method.questions:
                cat = (q.category or "").strip()
                if not cat:
                    continue
                orders_by_category.setdefault(cat, []).append(q.order)

        scores: dict[str, int] = {}
        categories_out: list[dict[str, Any]] = []

        for cat_name, orders in categories_map.items():
            if use_question_category:
                # Sum questions whose `category` matches this canonical name.
                matched = orders_by_category.get(cat_name, [])
                cat_score = sum(scored.get(o, 0) for o in matched)
            else:
                if not isinstance(orders, list):
                    continue
                if len(orders) == 0:
                    # Empty orders list = "all questions" shortcut. Lets a single-
                    # aspect test use `category` mode for labeled bands without
                    # listing every question number manually.
                    cat_score = sum(scored.values())
                else:
                    cat_score = sum(scored.get(int(o), 0) for o in orders if isinstance(o, (int, float)))
            scores[cat_name] = cat_score

            items = cat_interpretations.get(cat_name) or []
            match = _pick_interpretation(items, cat_score)
            if match:
                categories_out.append({
                    "name": cat_name,
                    "score": cat_score,
                    "label": match["label"],
                    "description": match["description"],
                })
            else:
                categories_out.append({
                    "name": cat_name,
                    "score": cat_score,
                    "label": "",
                    "description": "",
                })

        if not categories_out:
            return None

        return {
            "type": "category",
            "scores": scores,
            "categories": categories_out,
        }

    return None
