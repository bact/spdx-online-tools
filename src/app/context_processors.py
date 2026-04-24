# SPDX-FileCopyrightText: 2026-present SPDX Contributors
# SPDX-License-Identifier: Apache-2.0

from __future__ import annotations

from typing import TYPE_CHECKING, Any

import jpype

from app.core import initialise_jpype
from src.version import (
    java_tools_version,
    jpype_version,
    ntia_conformance_checker_version,
    python_tools_version,
    python_version,
    spdx_license_list_version,
    spdx_license_matcher_version,
    spdx_online_tools_version,
    spdx_python_model_version,
)

if TYPE_CHECKING:
    from django.http import HttpRequest


def _get_java_version() -> str:
    """Query Java version thru JPype"""
    try:
        initialise_jpype()
        System = jpype.java.lang.System
        vendor_ver = str(System.getProperty("java.vendor.version") or "")
        java_ver = str(System.getProperty("java.version") or "Unknown")
        if vendor_ver:
            # "Temurin-25.0.2+10" -> "Temurin 25.0.2"
            # "GraalVM CE 21.0.1+12.1" -> "GraalVM CE 21.0.1"
            clean = vendor_ver.rsplit("+", 1)[0].replace("-", " ", 1)
            return clean
        # Fallback: use vm.vendor + version
        vm_vendor = str(System.getProperty("java.vm.vendor") or "")
        return f"{vm_vendor} {java_ver}".strip()
    except Exception:
        return "Unknown"


def tool_versions(request: HttpRequest) -> dict[str, Any]:
    return {
        "java_tools_version": java_tools_version,
        "java_version": _get_java_version(),
        "jpype_version": jpype_version,
        "python_version": python_version,
        "ntia_conformance_checker_version": ntia_conformance_checker_version,
        "python_tools_version": python_tools_version,
        "spdx_license_list_version": spdx_license_list_version,
        "spdx_license_matcher_version": spdx_license_matcher_version,
        "spdx_online_tools_version": spdx_online_tools_version,
        "spdx_python_model_version": spdx_python_model_version,
    }
