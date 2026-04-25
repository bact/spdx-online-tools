# SPDX-FileCopyrightText: 2017 Rohit Lodha
# Copyright (c) 2017 Rohit Lodha
# SPDX-License-Identifier: Apache-2.0

from django.urls import path, re_path
from django.views.decorators.csrf import csrf_exempt

from app import views

handler400 = 'app.views.handler400'
handler403 = 'app.views.handler403'
handler404 = 'app.views.handler404'
handler500 = 'app.views.handler500'

urlpatterns = [
    path('', views.index, name='index'),
    path('validate/', views.validate, name='validate'),
    path('ntia_checker/', views.ntia_check, name='ntia_checker'),
    path('about/', views.about, name='about'),
    path('convert/', views.convert, name='convert'),
    path('compare/', views.compare, name='compare'),
    path('check_license/', views.check_license, name='check-license'),
    path('diff/', views.license_diff, name='license-diff'),
    path('login/', views.loginuser, name='login'),
    path('register/', views.register, name='register'),
    path('logout/', views.logoutuser, name='logout'),
    path('profile/', views.profile, name='profile'),
    path('checkusername/', views.checkusername, name='check-username'),
    path('xml_upload/', views.xml_upload, name='xml-upload'),
    path('dots/', views.dots, name='dots'),
    re_path(r'^edit/(?P<page_id>[0-9a-z]+)/$', views.license_xml_edit, name='editor'),
    path('edit_license_xml/<int:license_id>/', views.edit_license_xml, name='license_xml_editor'),
    path('edit_license_xml/', views.edit_license_xml, name='license_xml_editor_none'),
    path('validate_xml/', views.validate_xml, name='validate-xml'),
    path('search/', views.autocompleteModel, name='autocompleteModel'),
    path('make_issue/', views.issue, name='issue'),
    path('make_pr/', views.pull_request, name='pull-request'),
    path('beautify/', views.beautify, name='beautify'),
    path('update_session/', views.update_session_variables, name='update-session-variables'),
    path('submit_new_license/', views.submitNewLicense, name='submit-new-license'),
    path('submit_new_license_namespace/', views.submitNewLicenseNamespace, name='submit-new-license-namespace'),
    path('license_requests/', views.licenseRequests, name='license-requests'),
    path('license_requests/<int:licenseId>/', views.licenseInformation, name='license-information'),
    path('archive_requests/', views.archiveRequests, name='archive-license-xml'),
    path('archive_requests/<int:licenseId>/', views.licenseInformation, name='archived-license-information'),
    path('license_namespace_requests/', views.licenseNamespaceRequests, name='license-namespace-requests'),
    path('license_namespace_requests/<int:licenseId>/', views.licenseNamespaceInformation, name='license-namespace-information'),
    path('archive_namespace_requests/', views.archiveNamespaceRequests, name='archive-license-namespace-xml'),
    path('archive_namespace_requests/<int:licenseId>/', views.licenseNamespaceInformation, name='archived-license-namespace-information'),
    path('edit_license_namespace_xml/<int:license_id>/', views.edit_license_namespace_xml, name='license_namespace_xml_editor'),
    path('edit_license_namespace_xml/', views.edit_license_namespace_xml, name='license_namespace_xml_editor_none'),
    path('make_namespace_pr/', views.namespace_pull_request, name='namespace-pull-request'),
    path('promoted_namespace_requests/', views.promoteNamespaceRequests, name='promoted-license-namespace-xml'),
    path('promoted_namespace_requests/<int:licenseId>/', views.licenseNamespaceInformation, name='promoted-license-namespace-information'),
    path('post_to_github/', csrf_exempt(views.post_to_github), name='post_to_github'),
]
