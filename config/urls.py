
from django.contrib import admin
from django.urls import path

from assistant.views import home, chat_api

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", home, name="home"),
    path("api/chat/", chat_api, name="chat_api"),
]
