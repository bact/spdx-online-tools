# SPDX-FileCopyrightText: 2017 Rohit Lodha
# Copyright (c) 2017 Rohit Lodha
# SPDX-License-Identifier: Apache-2.0

from django.urls import include, path
from django.contrib import admin
from django.views.generic import RedirectView
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers
from api import views


router = routers.DefaultRouter()
router.register(r'validate', views.ValidateViewSet)
router.register(r'convert', views.ConvertViewSet)
router.register(r'compare', views.CompareViewSet)

urlpatterns = [
    path('', RedirectView.as_view(url=settings.HOME_URL), name="root"),
    path('admin/', admin.site.urls),
    path('app/', include('app.urls')),
    path('api/', include('api.urls')),
    path('api2/', include(router.urls)),
    path('api-auth/', include(("rest_framework.urls", 'api_auth'), namespace='rest_framework')),
    # Backward-compat: keep /oauth/ prefix so existing GitHub OAuth App callback
    # URL (/oauth/complete/github/) and any bookmarks still work. No namespace
    # here to avoid conflict with the 'social' namespace inside drf_social_oauth2.urls.
    path('oauth/', include('social_django.urls')),
    # Primary auth block: provides /auth/convert-token/, /auth/login/github/, etc.
    # social_django.urls is also included here (with 'social' namespace) by drf_social_oauth2.
    path('auth/', include('drf_social_oauth2.urls')),
]

urlpatterns += staticfiles_urlpatterns()
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
