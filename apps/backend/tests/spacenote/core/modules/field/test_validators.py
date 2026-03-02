"""Tests for validate_transfer_schema_compatibility()."""

import pytest

from spacenote.core.modules.field.models import FieldType, SpaceField
from spacenote.core.modules.field.validators import validate_transfer_schema_compatibility
from spacenote.core.modules.space.models import Space
from spacenote.errors import ValidationError


def _space(slug: str, fields: list[SpaceField] | None = None) -> Space:
    """Build a minimal Space with given slug and fields."""
    return Space(slug=slug, title=slug, fields=fields or [])


def _field(
    name: str,
    field_type: FieldType,
    *,
    required: bool = False,
    default: object = None,
    **opts: object,
) -> SpaceField:
    """Build a SpaceField with sensible option defaults per type."""
    options_map = {
        FieldType.STRING: dict,
        FieldType.BOOLEAN: dict,
        FieldType.NUMERIC: lambda: {"kind": opts.get("kind", "int")},
        FieldType.SELECT: lambda: {"values": opts.get("values", [])},
        FieldType.TAGS: dict,
        FieldType.USER: dict,
        FieldType.DATETIME: lambda: {"kind": opts.get("kind", "utc")},
        FieldType.IMAGE: dict,
    }
    return SpaceField(
        name=name,
        type=field_type,
        required=required,
        default=default,
        options=options_map[field_type](),
    )


class TestTransferSchemaCompatibility:
    """Validate schema compatibility checks for note transfer between spaces."""

    # ── passing cases ──

    def test_both_empty(self) -> None:
        validate_transfer_schema_compatibility(_space("a"), _space("b"))

    @pytest.mark.parametrize(
        "field_type",
        [FieldType.STRING, FieldType.BOOLEAN, FieldType.TAGS, FieldType.USER, FieldType.IMAGE],
    )
    def test_identical_simple_types(self, field_type: FieldType) -> None:
        src = _space("a", [_field("f", field_type)])
        tgt = _space("b", [_field("f", field_type)])
        validate_transfer_schema_compatibility(src, tgt)

    def test_select_exact_match(self) -> None:
        src = _space("a", [_field("s", FieldType.SELECT, values=["a", "b"])])
        tgt = _space("b", [_field("s", FieldType.SELECT, values=["a", "b"])])
        validate_transfer_schema_compatibility(src, tgt)

    def test_select_target_superset(self) -> None:
        src = _space("a", [_field("s", FieldType.SELECT, values=["a"])])
        tgt = _space("b", [_field("s", FieldType.SELECT, values=["a", "b", "c"])])
        validate_transfer_schema_compatibility(src, tgt)

    @pytest.mark.parametrize("kind", ["int", "float", "decimal"])
    def test_numeric_same_kind(self, kind: str) -> None:
        src = _space("a", [_field("n", FieldType.NUMERIC, kind=kind)])
        tgt = _space("b", [_field("n", FieldType.NUMERIC, kind=kind)])
        validate_transfer_schema_compatibility(src, tgt)

    @pytest.mark.parametrize("kind", ["utc", "local", "date"])
    def test_datetime_same_kind(self, kind: str) -> None:
        src = _space("a", [_field("d", FieldType.DATETIME, kind=kind)])
        tgt = _space("b", [_field("d", FieldType.DATETIME, kind=kind)])
        validate_transfer_schema_compatibility(src, tgt)

    def test_target_extra_optional_fields(self) -> None:
        src = _space("a", [_field("f", FieldType.STRING)])
        tgt = _space("b", [
            _field("f", FieldType.STRING),
            _field("extra", FieldType.BOOLEAN),
        ])
        validate_transfer_schema_compatibility(src, tgt)

    def test_target_extra_required_field_with_default(self) -> None:
        src = _space("a", [_field("f", FieldType.STRING)])
        tgt = _space("b", [
            _field("f", FieldType.STRING),
            _field("extra", FieldType.BOOLEAN, required=True, default=True),
        ])
        validate_transfer_schema_compatibility(src, tgt)

    def test_source_subset_of_target(self) -> None:
        src = _space("a", [_field("a", FieldType.STRING)])
        tgt = _space("b", [
            _field("a", FieldType.STRING),
            _field("b", FieldType.BOOLEAN),
            _field("c", FieldType.TAGS),
        ])
        validate_transfer_schema_compatibility(src, tgt)

    def test_multiple_compatible_fields(self) -> None:
        fields = [
            _field("name", FieldType.STRING),
            _field("active", FieldType.BOOLEAN),
            _field("count", FieldType.NUMERIC, kind="int"),
        ]
        src = _space("a", fields)
        tgt = _space("b", fields)
        validate_transfer_schema_compatibility(src, tgt)

    # ── failing: Rule 1 — source field missing in target ──

    def test_source_field_not_in_target(self) -> None:
        src = _space("a", [_field("x", FieldType.STRING)])
        tgt = _space("b")
        with pytest.raises(ValidationError, match=r"field 'x' does not exist in target"):
            validate_transfer_schema_compatibility(src, tgt)

    def test_disjoint_fields(self) -> None:
        src = _space("a", [_field("x", FieldType.STRING)])
        tgt = _space("b", [_field("y", FieldType.BOOLEAN)])
        with pytest.raises(ValidationError, match=r"field 'x' does not exist in target"):
            validate_transfer_schema_compatibility(src, tgt)

    # ── failing: Rule 1 — type/kind mismatch ──

    def test_type_mismatch(self) -> None:
        src = _space("a", [_field("f", FieldType.STRING)])
        tgt = _space("b", [_field("f", FieldType.BOOLEAN)])
        with pytest.raises(ValidationError, match=r"field 'f'.*string.*boolean"):
            validate_transfer_schema_compatibility(src, tgt)

    def test_string_kind_mismatch(self) -> None:
        src = _space("a", [_field("f", FieldType.STRING)])  # default kind=line
        tgt_field = SpaceField(name="f", type=FieldType.STRING, options={"kind": "text"})
        tgt = _space("b", [tgt_field])
        with pytest.raises(ValidationError, match=r"string/line.*string/text"):
            validate_transfer_schema_compatibility(src, tgt)

    def test_select_source_values_not_in_target(self) -> None:
        src = _space("a", [_field("s", FieldType.SELECT, values=["x", "y"])])
        tgt = _space("b", [_field("s", FieldType.SELECT, values=["x"])])
        with pytest.raises(ValidationError, match=r"SELECT values.*not present"):
            validate_transfer_schema_compatibility(src, tgt)

    def test_numeric_kind_mismatch(self) -> None:
        src = _space("a", [_field("n", FieldType.NUMERIC, kind="int")])
        tgt = _space("b", [_field("n", FieldType.NUMERIC, kind="float")])
        with pytest.raises(ValidationError, match=r"numeric/int.*numeric/float"):
            validate_transfer_schema_compatibility(src, tgt)

    def test_datetime_kind_mismatch(self) -> None:
        src = _space("a", [_field("d", FieldType.DATETIME, kind="utc")])
        tgt = _space("b", [_field("d", FieldType.DATETIME, kind="local")])
        with pytest.raises(ValidationError, match=r"datetime/utc.*datetime/local"):
            validate_transfer_schema_compatibility(src, tgt)

    # ── failing: Rule 2 — required target field without default ──

    def test_required_target_field_no_default(self) -> None:
        src = _space("a")
        tgt = _space("b", [_field("req", FieldType.STRING, required=True)])
        with pytest.raises(ValidationError, match=r"required field 'req'.*no default"):
            validate_transfer_schema_compatibility(src, tgt)

    def test_required_target_field_default_none(self) -> None:
        src = _space("a")
        tgt = _space("b", [_field("req", FieldType.STRING, required=True, default=None)])
        with pytest.raises(ValidationError, match=r"required field 'req'.*no default"):
            validate_transfer_schema_compatibility(src, tgt)
