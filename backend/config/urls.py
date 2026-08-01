from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from backend.config import api_views

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Health & System
    path('api/v1/health', api_views.health_check),
    path('api/v1/demo/seed', api_views.demo_seed),
    path('api/v1/demo/reset', api_views.demo_reset),
    path('api/v1/demo/status', api_views.demo_status),
    
    # Principals & Accounts
    path('api/v1/principals', api_views.principals_list_create),
    path('api/v1/principals/<uuid:pk>', api_views.principal_detail),
    path('api/v1/principals/<uuid:pk>/linked-accounts', api_views.principal_linked_accounts),
    
    # Agents & Mandates
    path('api/v1/agents', api_views.agents_list_create),
    path('api/v1/agents/<uuid:pk>', api_views.agent_detail),
    path('api/v1/agents/<uuid:pk>/freeze', api_views.agent_freeze),
    path('api/v1/agents/<uuid:pk>/unfreeze', api_views.agent_unfreeze),
    path('api/v1/agents/<uuid:pk>/restrict', api_views.agent_restrict),
    
    # Risk & Credit
    path('api/v1/agents/<uuid:pk>/risk-profile', api_views.agent_risk_profile),
    path('api/v1/agents/<uuid:pk>/risk/recalculate', api_views.agent_recalculate_risk),
    
    # Draws & Gateway
    path('api/v1/draws', api_views.draws_create),
    path('api/v1/draws/<uuid:pk>/advance', api_views.draw_advance),
    
    # Repayments
    path('api/v1/agents/<uuid:pk>/repayments', api_views.agent_repayments),
    path('api/v1/repayments/<uuid:pk>/attempt', api_views.repayment_attempt),
    path('api/v1/demo/repayments/<uuid:pk>/set-account-state', api_views.demo_set_account_state),
    
    # Audit Log
    path('api/v1/audit/events', api_views.audit_events_list),
    path('api/v1/audit/verify', api_views.audit_verify),
    path('api/v1/demo/audit/tamper', api_views.demo_audit_tamper),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
