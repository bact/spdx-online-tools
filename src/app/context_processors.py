# SPDX-FileCopyrightText: 2026-present SPDX Contributors
# SPDX-License-Identifier: Apache-2.0

from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Any

import jpype
import redis

from app.core import initialise_jpype
from src.secret import getRedisHost
from src.version import (
    java_tools_version,
    jpype_version,
    ntia_conformance_checker_version,
    python_tools_version,
    python_version,
    spdx_license_matcher_version,
    spdx_online_tools_version,
    spdx_python_model_version,
)

if TYPE_CHECKING:
    from django.http import HttpRequest


def _compute_java_version() -> str:
    try:
        initialise_jpype()
        System = jpype.java.lang.System
        vendor_ver = str(System.getProperty("java.vendor.version") or "")
        java_ver = str(System.getProperty("java.version") or "Unknown")
        if vendor_ver:
            # "Temurin-25.0.2+10" -> "25.0.2 (Temurin)"
            # "GraalVM CE 21.0.1+12.1" -> "21.0.1 (GraalVM CE)"
            no_build = vendor_ver.rsplit("+", 1)[0].replace("-", " ", 1)
            name, ver = no_build.rsplit(" ", 1)
            return f"{ver} ({name})"
        vm_vendor = str(System.getProperty("java.vm.vendor") or "")
        return f"{java_ver} ({vm_vendor})".strip()
    except Exception:
        return "Unknown"


# Computed once at startup — Java version doesn't change while the server runs
java_version: str = _compute_java_version()


def _get_license_metadata() -> dict[str, str]:
    """Fetch all license metadata keys in one Redis connection."""
    keys = (
        "license_list_version",
        "license_list_release_date",
        "license_db_last_updated",
    )
    try:
        r = redis.StrictRedis(host=getRedisHost(), port=6379, db=1)
        version_val, release_val, synced_val = r.mget(keys)

        list_version = version_val.decode() if version_val else "Unknown"

        if release_val:
            dt_str = release_val.decode().replace("Z", "+00:00")
            dt = datetime.datetime.fromisoformat(dt_str)
            release_date = dt.strftime("%Y-%m-%d %H:%M:%S %Z").strip()
        else:
            release_date = "Unknown"

        if synced_val:
            dt = datetime.datetime.fromisoformat(synced_val.decode())
            last_synced = dt.strftime("%Y-%m-%d %H:%M:%S %Z").strip()
        else:
            last_synced = "Unknown"

    except Exception:
        list_version = release_date = last_synced = "Unknown"

    return {
        "license_list_version": list_version,
        "license_list_release_date": release_date,
        "license_list_last_synced": last_synced,
    }


def tool_versions(request: HttpRequest) -> dict[str, Any]:
    return {
        "java_tools_version": java_tools_version,
        "java_version": java_version,
        "jpype_version": jpype_version,
        "python_version": python_version,
        "ntia_conformance_checker_version": ntia_conformance_checker_version,
        "python_tools_version": python_tools_version,
        "spdx_license_matcher_version": spdx_license_matcher_version,
        "spdx_online_tools_version": spdx_online_tools_version,
        "spdx_python_model_version": spdx_python_model_version,
        **_get_license_metadata(),
    }
