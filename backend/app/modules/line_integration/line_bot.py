import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from linebot import LineBotApi, WebhookHandler
from linebot.exceptions import InvalidSignatureError
from linebot.models import (
    TextSendMessage, FlexSendMessage, BubbleContainer, BoxComponent,
    TextComponent, ButtonComponent, PostbackAction, CarouselContainer,
    QuickReply, QuickReplyButton, PostbackTemplateAction, MessageEvent, TextMessage, PostbackEvent, FollowEvent, UnfollowEvent,
    ImageSendMessage, VideoSendMessage, AudioSendMessage, ImagemapSendMessage, ImagemapAction, ImagemapArea, URIAction, StickerSendMessage, LocationSendMessage,
    TemplateSendMessage, ButtonsTemplate, ConfirmTemplate, CarouselTemplate, ImageCarouselTemplate, CarouselColumn
)
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import json
import os
import asyncio
from .db import db
from .security import get_current_user
from .schemas import ReadingOut
from .onboarding_manager import OnboardingManager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/line-bot", tags=["line-bot"])

# LINE Bot configuration - will be initialized from MongoDB
line_bot_api = None
handler = None

# Telegram Bot configuration - will be initialized from MongoDB
TELEGRAM_BOT_TOKEN = ""
TELEGRAM_ADMIN_CHAT_ID = ""

async def initialize_line_bot():
    """Initialize LINE Bot API and handler from MongoDB settings"""
    global line_bot_api, handler, TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID
    
    try:
        # Get settings from MongoDB
        from .bot_manager import get_line_bot_settings, get_telegram_settings
        
        line_settings = await get_line_bot_settings()
        telegram_settings = await get_telegram_settings()
        
        # Initialize LINE Bot
        if line_settings["channel_access_token"] and line_settings["channel_secret"]:
            line_bot_api = LineBotApi(line_settings["channel_access_token"])
            handler = WebhookHandler(line_settings["channel_secret"])
            logger.info("LINE Bot initialized successfully from MongoDB settings")
        else:
            logger.warning("LINE Bot not initialized - missing credentials in MongoDB")
        
        # Initialize Telegram settings
        TELEGRAM_BOT_TOKEN = telegram_settings["telegram_bot_token"]
        TELEGRAM_ADMIN_CHAT_ID = telegram_settings["telegram_admin_chat_id"]
        
    except Exception as e:
        logger.error(f"Error initializing LINE Bot from MongoDB: {str(e)}")

def get_line_bot_api():
    """Get LINE Bot API instance"""
    if line_bot_api is None:
        logger.error("LINE Bot API not initialized. Call initialize_line_bot() first.")
        return None
    return line_bot_api

def get_webhook_handler():
    """Get webhook handler instance"""
    if handler is None:
        logger.error("Webhook handler not initialized. Call initialize_line_bot() first.")
        return None
    return handler

def send_telegram_notification(message: str):
    """Send notification to Telegram admin bot"""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_ADMIN_CHAT_ID:
        logger.warning("Telegram notification skipped - missing credentials")
        return
    
    import requests
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    data = {
        "chat_id": TELEGRAM_ADMIN_CHAT_ID,
        "text": message,
        "parse_mode": "HTML"
    }
    try:
        logger.debug(f"Sending Telegram notification to {TELEGRAM_ADMIN_CHAT_ID}")
        response = requests.post(url, json=data)
        if response.status_code == 200:
            logger.info("Telegram notification sent successfully")
        else:
            logger.error(f"Telegram notification failed with status {response.status_code}")
    except Exception as e:
        logger.error(f"Failed to send Telegram notification: {e}")

def create_glucose_summary_flex(reading: Dict[str, Any]) -> FlexSendMessage:
    """Create Flex message for glucose reading summary"""
    
    # Determine color based on glucose level
    value = reading['value_mg_dl']
    if value > 180:
        color = "#FF4444"  # Red for high
        status = "สูง"
    elif value < 70:
        color = "#FF8800"  # Orange for low
        status = "ต่ำ"
    else:
        color = "#00CC44"  # Green for normal
        status = "ปกติ"
    
    # Tag mapping
    tag_map = {
        'before_meal': 'ก่อนอาหาร',
        'after_meal': 'หลังอาหาร',
        'fasting': 'อดอาหาร',
        'random': 'สุ่ม'
    }
    
    bubble = BubbleContainer(
        size="kilo",
        header=BoxComponent(
            layout="vertical",
            contents=[
                TextComponent(
                    text="📊 ผลการตรวจน้ำตาลในเลือด",
                    weight="bold",
                    size="lg",
                    color="#FFFFFF"
                )
            ],
            backgroundColor=color,
            paddingAll="20px"
        ),
        body=BoxComponent(
            layout="vertical",
            contents=[
                BoxComponent(
                    layout="horizontal",
                    contents=[
                        TextComponent(
                            text="ค่าน้ำตาล:",
                            size="sm",
                            color="#666666"
                        ),
                        TextComponent(
                            text=f"{value} mg/dL",
                            size="lg",
                            weight="bold",
                            color="#333333"
                        )
                    ],
                    margin="md"
                ),
                BoxComponent(
                    layout="horizontal",
                    contents=[
                        TextComponent(
                            text="สถานะ:",
                            size="sm",
                            color="#666666"
                        ),
                        TextComponent(
                            text=status,
                            size="sm",
                            color=color,
                            weight="bold"
                        )
                    ],
                    margin="sm"
                ),
                BoxComponent(
                    layout="horizontal",
                    contents=[
                        TextComponent(
                            text="เวลา:",
                            size="sm",
                            color="#666666"
                        ),
                        TextComponent(
                            text=tag_map.get(reading['tag'], reading['tag']),
                            size="sm",
                            color="#333333"
                        )
                    ],
                    margin="sm"
                ),
                BoxComponent(
                    layout="horizontal",
                    contents=[
                        TextComponent(
                            text="วันที่:",
                            size="sm",
                            color="#666666"
                        ),
                        TextComponent(
                            text=datetime.fromisoformat(reading['measured_at'].replace('Z', '+00:00')).strftime("%d/%m/%Y %H:%M"),
                            size="sm",
                            color="#333333"
                        )
                    ],
                    margin="sm"
                )
            ],
            paddingAll="20px"
        )
    )
    
    if reading.get('note'):
        bubble.body.contents.append(
            BoxComponent(
                layout="horizontal",
                contents=[
                    TextComponent(
                        text="หมายเหตุ:",
                        size="sm",
                        color="#666666"
                    ),
                    TextComponent(
                        text=reading['note'],
                        size="sm",
                        color="#333333",
                        wrap=True
                    )
                ],
                margin="sm"
            )
        )
    
    return FlexSendMessage(alt_text="ผลการตรวจน้ำตาลในเลือด", contents=bubble)

def create_history_selection_flex() -> FlexSendMessage:
    """Create Flex message for history period selection"""
    
    carousel = CarouselContainer(
        contents=[
            BubbleContainer(
                size="kilo",
                header=BoxComponent(
                    layout="vertical",
                    contents=[
                        TextComponent(
                            text="📅 ประวัติ 1 สัปดาห์",
                            weight="bold",
                            size="lg",
                            color="#FFFFFF"
                        )
                    ],
                    backgroundColor="#3B82F6",
                    paddingAll="20px"
                ),
                body=BoxComponent(
                    layout="vertical",
                    contents=[
                        TextComponent(
                            text="ดูประวัติการตรวจน้ำตาลในเลือดย้อนหลัง 7 วัน",
                            size="sm",
                            color="#666666",
                            wrap=True
                        )
                    ],
                    paddingAll="20px"
                ),
                footer=BoxComponent(
                    layout="vertical",
                    contents=[
                        ButtonComponent(
                            style="primary",
                            color="#3B82F6",
                            action=PostbackAction(
                                label="เลือก",
                                data="history_weekly"
                            )
                        )
                    ],
                    paddingAll="20px"
                )
            ),
            BubbleContainer(
                size="kilo",
                header=BoxComponent(
                    layout="vertical",
                    contents=[
                        TextComponent(
                            text="📅 ประวัติ 1 เดือน",
                            weight="bold",
                            size="lg",
                            color="#FFFFFF"
                        )
                    ],
                    backgroundColor="#10B981",
                    paddingAll="20px"
                ),
                body=BoxComponent(
                    layout="vertical",
                    contents=[
                        TextComponent(
                            text="ดูประวัติการตรวจน้ำตาลในเลือดย้อนหลัง 30 วัน",
                            size="sm",
                            color="#666666",
                            wrap=True
                        )
                    ],
                    paddingAll="20px"
                ),
                footer=BoxComponent(
                    layout="vertical",
                    contents=[
                        ButtonComponent(
                            style="primary",
                            color="#10B981",
                            action=PostbackAction(
                                label="เลือก",
                                data="history_monthly"
                            )
                        )
                    ],
                    paddingAll="20px"
                )
            ),
            BubbleContainer(
                size="kilo",
                header=BoxComponent(
                    layout="vertical",
                    contents=[
                        TextComponent(
                            text="📅 ประวัติ 3 เดือน",
                            weight="bold",
                            size="lg",
                            color="#FFFFFF"
                        )
                    ],
                    backgroundColor="#F59E0B",
                    paddingAll="20px"
                ),
                body=BoxComponent(
                    layout="vertical",
                    contents=[
                        TextComponent(
                            text="ดูประวัติการตรวจน้ำตาลในเลือดย้อนหลัง 90 วัน",
                            size="sm",
                            color="#666666",
                            wrap=True
                        )
                    ],
                    paddingAll="20px"
                ),
                footer=BoxComponent(
                    layout="vertical",
                    contents=[
                        ButtonComponent(
                            style="primary",
                            color="#F59E0B",
                            action=PostbackAction(
                                label="เลือก",
                                data="history_3monthly"
                            )
                        )
                    ],
                    paddingAll="20px"
                )
            ),
            BubbleContainer(
                size="kilo",
                header=BoxComponent(
                    layout="vertical",
                    contents=[
                        TextComponent(
                            text="📅 ประวัติ 6 เดือน",
                            weight="bold",
                            size="lg",
                            color="#FFFFFF"
                        )
                    ],
                    backgroundColor="#EF4444",
                    paddingAll="20px"
                ),
                body=BoxComponent(
                    layout="vertical",
                    contents=[
                        TextComponent(
                            text="ดูประวัติการตรวจน้ำตาลในเลือดย้อนหลัง 180 วัน",
                            size="sm",
                            color="#666666",
                            wrap=True
                        )
                    ],
                    paddingAll="20px"
                ),
                footer=BoxComponent(
                    layout="vertical",
                    contents=[
                        ButtonComponent(
                            style="primary",
                            color="#EF4444",
                            action=PostbackAction(
                                label="เลือก",
                                data="history_6monthly"
                            )
                        )
                    ],
                    paddingAll="20px"
                )
            )
        ]
    )
    
    return FlexSendMessage(alt_text="เลือกช่วงเวลาประวัติ", contents=carousel)

def create_main_menu_flex() -> FlexSendMessage:
    """Create main menu Flex message with all available options"""
    
    bubble = BubbleContainer(
        size="kilo",
        header=BoxComponent(
            layout="vertical",
            contents=[
                TextComponent(
                    text="🏠 เมนูหลัก DiaCare Buddy",
                    weight="bold",
                    size="lg",
                    color="#FFFFFF"
                )
            ],
            backgroundColor="#8B5CF6",
            paddingAll="20px"
        ),
        body=BoxComponent(
            layout="vertical",
            contents=[
                TextComponent(
                    text="เลือกบริการที่ต้องการ:",
                    size="sm",
                    color="#333333",
                    margin="md"
                )
            ],
            paddingAll="20px"
        ),
        footer=BoxComponent(
            layout="vertical",
            contents=[
                ButtonComponent(
                    style="primary",
                    color="#3B82F6",
                    action=PostbackAction(
                        label="📈 ดูประวัติ",
                        data="welcome_start"
                    )
                ),
                ButtonComponent(
                    style="primary",
                    color="#8B5CF6",
                    action=PostbackAction(
                        label="🚀 แอปพลิเคชัน",
                        data="liff_apps"
                    )
                )
            ],
            paddingAll="20px"
        )
    )
    
    return FlexSendMessage(alt_text="เมนูหลัก DiaCare Buddy", contents=bubble)

async def create_welcome_flex_message(user_info: Dict[str, Any]) -> FlexSendMessage:
    """Create welcome Flex message for new users with LIFF buttons"""
    
    # Get LIFF IDs from database
    from .db import db
    settings = await db.bot_settings.find_one({})
    
    liff_input_id = settings.get("liff_input_id", "") if settings else ""
    liff_dashboard_id = settings.get("liff_dashboard_id", "") if settings else ""
    liff_qr_generator_id = settings.get("liff_qr_generator_id", "") if settings else ""
    qr_generator_enabled = settings.get("liff_qr_generator_enabled", True) if settings else True
    
    # Create LIFF buttons
    liff_buttons = []
    
    # DTX Input LIFF Button
    if liff_input_id:
        liff_buttons.append(
            ButtonComponent(
                style="primary",
                color="#10B981",
                action=URIAction(
                    label="📝 บันทึกข้อมูล DTX",
                    uri=f"https://liff.line.me/{liff_input_id}"
                )
            )
        )
    
    # Dashboard LIFF Button
    if liff_dashboard_id:
        liff_buttons.append(
            ButtonComponent(
                style="primary",
                color="#3B82F6",
                action=URIAction(
                    label="📊 แดชบอร์ด",
                    uri=f"https://liff.line.me/{liff_dashboard_id}"
                )
            )
        )
    
    # QR Generator LIFF Button (only if enabled)
    if liff_qr_generator_id and qr_generator_enabled:
        liff_buttons.append(
            ButtonComponent(
                style="primary",
                color="#F59E0B",
                action=URIAction(
                    label="🔗 สร้าง QR Code",
                    uri=f"https://liff.line.me/{liff_qr_generator_id}"
                )
            )
        )
    
    # Add main action button
    liff_buttons.append(
        ButtonComponent(
            style="primary",
            color="#8B5CF6",
            action=PostbackAction(
                label="📈 ดูประวัติ",
                data="welcome_start"
            )
        )
    )
    
    bubble = BubbleContainer(
        size="mega",
        header=BoxComponent(
            layout="vertical",
            contents=[
                TextComponent(
                    text="🎉 ยินดีต้อนรับสู่ DiaCare Buddy:ชีวิต พิชิตเบาหวาน",
                    weight="bold",
                    size="lg",
                    color="#FFFFFF"
                ),
                TextComponent(
                    text=f"สวัสดีคุณ {user_info.get('display_name', 'ผู้ใช้')}",
                    size="sm",
                    color="#FFFFFF",
                    margin="sm"
                )
            ],
            backgroundColor="#3B82F6",
            paddingAll="20px"
        ),
        body=BoxComponent(
            layout="vertical",
            contents=[
                TextComponent(
                    text="🤖 ผมเป็นผู้ช่วยดูแลสุขภาพสำหรับผู้ป่วยเบาหวาน",
                    size="sm",
                    color="#333333",
                    margin="md"
                ),
                BoxComponent(
                    layout="vertical",
                    contents=[
                        TextComponent(
                            text="📋 สิ่งที่ผมช่วยคุณได้:",
                            size="sm",
                            weight="bold",
                            color="#333333",
                            margin="md"
                        ),
                        TextComponent(
                            text="• บันทึกค่าน้ำตาลในเลือด",
                            size="sm",
                            color="#666666",
                            margin="sm"
                        ),
                        TextComponent(
                            text="• ดูประวัติการตรวจย้อนหลัง",
                            size="sm",
                            color="#666666",
                            margin="sm"
                        ),
                        TextComponent(
                            text="• ติดตามแนวโน้มสุขภาพ",
                            size="sm",
                            color="#666666",
                            margin="sm"
                        ),
                        TextComponent(
                            text="• รับคำแนะนำการดูแลสุขภาพ",
                            size="sm",
                            color="#666666",
                            margin="sm"
                        )
                    ],
                    margin="md"
                ),
                BoxComponent(
                    layout="vertical",
                    contents=[
                        TextComponent(
                            text="🚀 แอปพลิเคชัน:",
                            size="sm",
                            weight="bold",
                            color="#333333",
                            margin="md"
                        ),
                        TextComponent(
                            text="• 📝 บันทึกข้อมูล DTX - บันทึกค่าน้ำตาลและข้อมูลสุขภาพ",
                            size="sm",
                            color="#666666",
                            margin="sm"
                        ),
                        TextComponent(
                            text="• 📊 แดชบอร์ด - ดูประวัติและสถิติสุขภาพ",
                            size="sm",
                            color="#666666",
                            margin="sm"
                        ),
                        TextComponent(
                            text="• 🔗 สร้าง QR Code - แชร์ข้อมูลกับผู้ดูแล",
                            size="sm",
                            color="#666666",
                            margin="sm"
                        )
                    ],
                    margin="md"
                )
            ],
            paddingAll="20px"
        ),
        footer=BoxComponent(
            layout="vertical",
            contents=liff_buttons,
            paddingAll="20px"
        )
    )
    
    return FlexSendMessage(alt_text="ยินดีต้อนรับสู่ DiaCare Buddy", contents=bubble)

async def create_liff_buttons_flex() -> FlexSendMessage:
    """Create Flex message with LIFF application buttons"""
    
    # Get LIFF IDs from database
    from .db import db
    settings = await db.bot_settings.find_one({})
    
    liff_input_id = settings.get("liff_input_id", "") if settings else ""
    liff_dashboard_id = settings.get("liff_dashboard_id", "") if settings else ""
    liff_qr_generator_id = settings.get("liff_qr_generator_id", "") if settings else ""
    qr_generator_enabled = settings.get("liff_qr_generator_enabled", True) if settings else True
    
    # Create LIFF buttons
    liff_buttons = []
    
    # DTX Input LIFF Button
    if liff_input_id:
        liff_buttons.append(
            ButtonComponent(
                style="primary",
                color="#10B981",
                action=URIAction(
                    label="📝 บันทึกข้อมูล DTX",
                    uri=f"https://liff.line.me/{liff_input_id}"
                )
            )
        )
    
    # Dashboard LIFF Button
    if liff_dashboard_id:
        liff_buttons.append(
            ButtonComponent(
                style="primary",
                color="#3B82F6",
                action=URIAction(
                    label="📊 แดชบอร์ด",
                    uri=f"https://liff.line.me/{liff_dashboard_id}"
                )
            )
        )
    
    # QR Generator LIFF Button (only if enabled)
    if liff_qr_generator_id and qr_generator_enabled:
        liff_buttons.append(
            ButtonComponent(
                style="primary",
                color="#F59E0B",
                action=URIAction(
                    label="🔗 สร้าง QR Code",
                    uri=f"https://liff.line.me/{liff_qr_generator_id}"
                )
            )
        )
    
    bubble = BubbleContainer(
        size="kilo",
        header=BoxComponent(
            layout="vertical",
            contents=[
                TextComponent(
                    text="🚀 แอปพลิเคชัน DiaCare Buddy",
                    weight="bold",
                    size="lg",
                    color="#FFFFFF"
                )
            ],
            backgroundColor="#8B5CF6",
            paddingAll="20px"
        ),
        body=BoxComponent(
            layout="vertical",
            contents=[
                TextComponent(
                    text="เลือกแอปพลิเคชันที่ต้องการใช้งาน:",
                    size="sm",
                    color="#333333",
                    margin="md"
                ),
                BoxComponent(
                    layout="vertical",
                    contents=[
                        TextComponent(
                            text="📝 บันทึกข้อมูล DTX - บันทึกค่าน้ำตาลและข้อมูลสุขภาพ",
                            size="sm",
                            color="#666666",
                            margin="sm"
                        ),
                        TextComponent(
                            text="📊 แดชบอร์ด - ดูประวัติและสถิติสุขภาพ",
                            size="sm",
                            color="#666666",
                            margin="sm"
                        ),
                        TextComponent(
                            text="🔗 สร้าง QR Code - แชร์ข้อมูลกับผู้ดูแล",
                            size="sm",
                            color="#666666",
                            margin="sm"
                        )
                    ],
                    margin="md"
                )
            ],
            paddingAll="20px"
        ),
        footer=BoxComponent(
            layout="vertical",
            contents=liff_buttons,
            paddingAll="20px"
        )
    )
    
    return FlexSendMessage(alt_text="แอปพลิเคชัน DiaCare Buddy", contents=bubble)

def create_history_summary_flex(user_id: str, period: str, readings: List[Dict], stats: Dict) -> FlexSendMessage:
    """Create Flex message for history summary"""
    
    period_map = {
        'weekly': '1 สัปดาห์',
        'monthly': '1 เดือน',
        '3monthly': '3 เดือน',
        '6monthly': '6 เดือน'
    }
    
    # Calculate A1C estimate
    avg_glucose = stats.get('avg', 0)
    a1c_estimate = (avg_glucose + 46.7) / 28.7 if avg_glucose > 0 else 0
    
    # Create chart-like visualization
    chart_text = ""
    if readings:
        for i, reading in enumerate(readings[:10]):  # Show last 10 readings
            value = reading['value_mg_dl']
            if value > 180:
                bar = "🔴"
            elif value < 70:
                bar = "🟠"
            else:
                bar = "🟢"
            chart_text += f"{bar} {value} mg/dL\n"
    
    bubble = BubbleContainer(
        size="giga",
        header=BoxComponent(
            layout="vertical",
            contents=[
                TextComponent(
                    text=f"📊 ประวัติน้ำตาลในเลือด ({period_map.get(period, period)})",
                    weight="bold",
                    size="lg",
                    color="#FFFFFF"
                )
            ],
            backgroundColor="#1E293B",
            paddingAll="20px"
        ),
        body=BoxComponent(
            layout="vertical",
            contents=[
                BoxComponent(
                    layout="horizontal",
                    contents=[
                        TextComponent(
                            text="จำนวนการตรวจ:",
                            size="sm",
                            color="#666666"
                        ),
                        TextComponent(
                            text=str(stats.get('count', 0)),
                            size="sm",
                            weight="bold",
                            color="#333333"
                        )
                    ],
                    margin="md"
                ),
                BoxComponent(
                    layout="horizontal",
                    contents=[
                        TextComponent(
                            text="ค่าเฉลี่ย:",
                            size="sm",
                            color="#666666"
                        ),
                        TextComponent(
                            text=f"{stats.get('avg', 0):.1f} mg/dL",
                            size="sm",
                            weight="bold",
                            color="#333333"
                        )
                    ],
                    margin="sm"
                ),
                BoxComponent(
                    layout="horizontal",
                    contents=[
                        TextComponent(
                            text="ค่าต่ำสุด:",
                            size="sm",
                            color="#666666"
                        ),
                        TextComponent(
                            text=f"{stats.get('min', 0)} mg/dL",
                            size="sm",
                            weight="bold",
                            color="#333333"
                        )
                    ],
                    margin="sm"
                ),
                BoxComponent(
                    layout="horizontal",
                    contents=[
                        TextComponent(
                            text="ค่าสูงสุด:",
                            size="sm",
                            color="#666666"
                        ),
                        TextComponent(
                            text=f"{stats.get('max', 0)} mg/dL",
                            size="sm",
                            weight="bold",
                            color="#333333"
                        )
                    ],
                    margin="sm"
                ),
                BoxComponent(
                    layout="horizontal",
                    contents=[
                        TextComponent(
                            text="A1C ประมาณ:",
                            size="sm",
                            color="#666666"
                        ),
                        TextComponent(
                            text=f"{a1c_estimate:.2f}%",
                            size="sm",
                            weight="bold",
                            color="#333333"
                        )
                    ],
                    margin="sm"
                ),
                BoxComponent(
                    layout="vertical",
                    contents=[
                        TextComponent(
                            text="📈 ประวัติล่าสุด:",
                            size="sm",
                            weight="bold",
                            color="#333333",
                            margin="md"
                        ),
                        TextComponent(
                            text=chart_text or "ไม่มีข้อมูล",
                            size="xs",
                            color="#666666",
                            wrap=True
                        )
                    ]
                )
            ],
            paddingAll="20px"
        ),
        footer=BoxComponent(
            layout="vertical",
            contents=[
                ButtonComponent(
                    style="primary",
                    color="#8B5CF6",
                    action=PostbackAction(
                        label="🏠 เมนูหลัก",
                        data="main_menu"
                    )
                ),
                ButtonComponent(
                    style="primary",
                    color="#3B82F6",
                    action=PostbackAction(
                        label="📈 ดูประวัติอื่น",
                        data="welcome_start"
                    )
                )
            ],
            paddingAll="20px"
        )
    )
    
    return FlexSendMessage(alt_text=f"ประวัติน้ำตาลในเลือด {period_map.get(period, period)}", contents=bubble)

@router.post("/webhook")
async def line_webhook(request: Request):
    """LINE Bot webhook endpoint"""
    signature = request.headers.get('X-Line-Signature', '')
    body = await request.body()
    
    # Store body in request state for middleware access
    request.state.webhook_body = body
    request.state.webhook_signature = signature
    
    logger.info(f"LINE webhook received - Signature: {signature[:20]}...")
    logger.debug(f"Webhook body length: {len(body)} bytes")
    
    try:
        webhook_handler = get_webhook_handler()
        if webhook_handler is None:
            logger.error("Webhook handler not initialized")
            raise HTTPException(500, "Bot not configured")
        
        # Register event handlers before processing
        register_event_handlers()
        
        webhook_handler.handle(body.decode('utf-8'), signature)
        logger.info("LINE webhook processed successfully")
    except InvalidSignatureError:
        logger.error("Invalid LINE webhook signature")
        raise HTTPException(400, "Invalid signature")
    except Exception as e:
        logger.error(f"Error processing LINE webhook: {e}")
        raise HTTPException(500, "Internal server error")
    
    return {"ok": True}

async def handle_follow(event):
    """Handle when user adds bot as friend"""
    user_id = event.source.user_id
    logger.info(f"New user followed bot: {user_id}")
    
    # Get user profile
    try:
        api = get_line_bot_api()
        if api is None:
            logger.error("LINE Bot API not initialized")
            return
            
        profile = api.get_profile(user_id)
        user_info = {
            'line_user_id': user_id,
            'display_name': profile.display_name,
            'picture_url': profile.picture_url,
            'status_message': profile.status_message
        }
        
        logger.info(f"User profile retrieved: {user_info['display_name']} ({user_id})")
        
        # Store follower in LINE_Follow collection (not users collection)
        follower_data = {
            'line_user_id': user_id,
            'display_name': profile.display_name,
            'picture_url': profile.picture_url,
            'status_message': profile.status_message,
            'followed_at': datetime.utcnow(),
            'is_active': True,
            'last_interaction': datetime.utcnow(),
            'interaction_count': 0  # Initialize interaction count
        }
        
        # Upsert follower data
        await db.line_followers.update_one(
            {'line_user_id': user_id},
            {'$set': follower_data},
            upsert=True
        )
        
        logger.info(f"Follower stored in LINE_Follow collection: {user_id}")
        
        # Check if there's an active follow event flow
        flow = await db.follow_event_flows.find_one({"is_active": True})
        if flow:
            # Use the configured flow
            welcome_msg = flow.get("welcome_message", {})
            if welcome_msg.get("include_quick_replies") and welcome_msg.get("quick_replies"):
                # Create custom Flex message with quick replies
                from .bot_manager import create_custom_welcome_flex_message
                welcome_flex = create_custom_welcome_flex_message(user_info, welcome_msg)
                api.reply_message(event.reply_token, welcome_flex)
            else:
                # Send simple text message
                api.reply_message(
                    event.reply_token,
                    TextSendMessage(text=welcome_msg.get("text", "Welcome to DiaCare Buddy!"))
                )
            
            # Start onboarding flow in background
            import asyncio
            asyncio.create_task(start_onboarding_flow(user_id))
        else:
            # Use default welcome message
            welcome_flex = await create_welcome_flex_message(user_info)
            api.reply_message(event.reply_token, welcome_flex)
        
        logger.info(f"Welcome message sent to user: {user_id}")
        
        # Track message statistics for analytics
        await track_message_statistics("reply", user_id, "welcome_message")
        
        # Send new user notification to Telegram
        import asyncio
        asyncio.create_task(send_new_user_notification(user_id, user_info))
        logger.info(f"Telegram notification scheduled for user: {user_id}")
        
    except Exception as e:
        logger.error(f"Error handling follow event for user {user_id}: {e}")
        # Send simple welcome message as fallback
        api = get_line_bot_api()
        if api is not None:
            api.reply_message(
                event.reply_token,
                TextSendMessage(text="สวัสดี! ยินดีต้อนรับสู่ DiaCare Buddy 🤖\n\nพิมพ์ 'ข้อมูลปริมาณน้ำตาลในเลือดย้อนหลัง' เพื่อดูประวัติการตรวจของคุณ")
            )
            logger.info(f"Fallback welcome message sent to user: {user_id}")

async def handle_unfollow(event):
    """Handle when user unfollows bot - PDPA compliant data deletion"""
    user_id = event.source.user_id
    logger.info(f"User unfollowed bot: {user_id}")
    
    try:
        # Delete follower from LINE_Follow collection
        follower_result = await db.line_followers.delete_one({"line_user_id": user_id})
        
        if follower_result.deleted_count > 0:
            logger.info(f"Follower deleted from LINE_Follow collection: {user_id}")
        else:
            logger.warning(f"Follower not found in LINE_Follow collection: {user_id}")
        
        # Check if user exists in users collection (registered users)
        registered_user = await db.users.find_one({"line_user_id": user_id})
        
        if registered_user:
            # User was registered - mark as unfollowed but keep data for potential re-registration
            await db.users.update_one(
                {"line_user_id": user_id},
                {
                    "$set": {
                        "unfollowed_at": datetime.utcnow(),
                        "is_active": False,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            logger.info(f"Registered user marked as unfollowed: {user_id}")
        else:
            # User was only a follower - no additional action needed
            logger.info(f"Non-registered follower unfollowed: {user_id}")
        
        # Send unfollow notification to Telegram admin
        unfollow_message = f"""
👋 <b>ผู้ใช้เลิกติดตาม</b>

👤 <b>User ID:</b> {user_id}
📅 <b>วันที่เลิกติดตาม:</b> {datetime.utcnow().strftime('%d/%m/%Y %H:%M')}
📊 <b>สถานะ:</b> {'Registered User' if registered_user else 'Follower Only'}
        """
        send_telegram_notification(unfollow_message)
        logger.info(f"Unfollow notification sent for user: {user_id}")
        
    except Exception as e:
        logger.error(f"Error handling unfollow event for user {user_id}: {e}")

async def start_onboarding_flow(user_id: str):
    """Start onboarding flow for new follower using active flow"""
    try:
        # Get active follow flow
        flow = await db.follow_event_flows.find_one({"is_active": True})
        if not flow:
            logger.warning("No active follow flow found")
            return
        
        onboarding_steps = flow.get("onboarding_steps", [])
        if not onboarding_steps:
            logger.info("No onboarding steps configured")
            return
        
        # Initialize onboarding status for the user
        flow_id = str(flow.get("_id"))
        total_steps = len(onboarding_steps)
        
        success = await OnboardingManager.initialize_onboarding_status(
            user_id, flow_id, total_steps
        )
        
        if not success:
            logger.error(f"Failed to initialize onboarding status for user: {user_id}")
            return
        
        # Send onboarding steps with delays
        for step in onboarding_steps:
            if step.get("delay_seconds", 0) > 0:
                await asyncio.sleep(step["delay_seconds"])
            
            await send_onboarding_step(user_id, step)
        
        logger.info(f"Onboarding flow started for user: {user_id}")
        
    except Exception as e:
        logger.error(f"Error starting onboarding flow: {str(e)}")

async def send_onboarding_step(user_id: str, step: dict):
    """Send a single onboarding step message"""
    try:
        api = get_line_bot_api()
        if api is None:
            logger.error("LINE Bot API not initialized")
            return
        
        step_type = step.get("type", "text")
        content = step.get("content", {})
        
        if step_type == "text":
            message = TextSendMessage(text=content.get("text", ""))
        elif step_type == "flex":
            message = FlexSendMessage(alt_text="Onboarding", contents=content)
        elif step_type == "image":
            message = ImageSendMessage(original_content_url=content.get("url", ""))
        elif step_type == "video":
            message = VideoSendMessage(original_content_url=content.get("url", ""))
        else:
            message = TextSendMessage(text=content.get("text", ""))
        
        api.push_message(user_id, message)
        logger.info(f"Onboarding step {step.get('step', 0)} sent to user: {user_id}")
        
    except Exception as e:
        logger.error(f"Error sending onboarding step: {str(e)}")

async def handle_text_message(event):
    """Handle text messages from users"""
    user_id = event.source.user_id
    text = event.message.text
    
    logger.info(f"Text message from user {user_id}: {text}")
    
    api = get_line_bot_api()
    if api is None:
        logger.error("LINE Bot API not initialized")
        return
    
    # Check if user is in onboarding flow
    onboarding_status = await OnboardingManager.get_user_onboarding_status(user_id)
    
    if onboarding_status and onboarding_status.get("in_progress"):
        # Handle onboarding response
        await handle_onboarding_response(event, user_id, text, onboarding_status)
    else:
        # Handle regular messages
        await handle_regular_message(event, user_id, text, api)

async def handle_onboarding_response(event, user_id: str, text: str, onboarding_status: Dict[str, Any]):
    """Handle user response during onboarding flow"""
    try:
        current_step = onboarding_status.get("current_step", 1)
        flow_id = onboarding_status.get("flow_id")
        total_steps = onboarding_status.get("total_steps", 0)
        
        # Get the current step details from the flow
        from bson import ObjectId
        flow = await db.follow_event_flows.find_one({"_id": ObjectId(flow_id)})
        if not flow:
            logger.error(f"Flow not found for user {user_id}")
            return
        
        onboarding_steps = flow.get("onboarding_steps", [])
        if current_step > len(onboarding_steps):
            logger.error(f"Invalid step number {current_step} for user {user_id}")
            return
        
        current_step_data = onboarding_steps[current_step - 1]
        step_type = current_step_data.get("type", "text")
        question = current_step_data.get("content", {}).get("text", "")
        
        # Store the user response
        success = await OnboardingManager.store_onboarding_response(
            user_id, current_step, step_type, question, text, flow_id
        )
        
        if not success:
            logger.error(f"Failed to store onboarding response for user {user_id}")
            return
        
        # Process the response
        processed_data = await OnboardingManager.process_onboarding_response(
            user_id, current_step, text
        )
        
        # Check if this is the last step
        if current_step >= total_steps:
            # Complete onboarding
            await OnboardingManager.complete_onboarding(user_id)
            
            # Send completion message
            api = get_line_bot_api()
            if api:
                completion_message = TextSendMessage(
                    text="🎉 ขอบคุณสำหรับการให้ข้อมูล! การตั้งค่าเสร็จสิ้นแล้ว\n\nตอนนี้คุณสามารถใช้บริการของเราได้แล้ว"
                )
                api.reply_message(event.reply_token, completion_message)
                
                # Send welcome message with main menu
                flex_message = create_history_selection_flex()
                api.push_message(user_id, flex_message)
            
            logger.info(f"Onboarding completed for user: {user_id}")
        else:
            # Send next step
            next_step_data = onboarding_steps[current_step]
            await send_onboarding_step(user_id, next_step_data)
            
            # Send acknowledgment
            api = get_line_bot_api()
            if api:
                ack_message = TextSendMessage(text="✅ ได้รับข้อมูลแล้ว! ขั้นตอนถัดไป...")
                api.reply_message(event.reply_token, ack_message)
        
    except Exception as e:
        logger.error(f"Error handling onboarding response for user {user_id}: {e}")

async def find_matching_keyword(user_text: str) -> Optional[dict]:
    """Find the highest priority keyword that matches user text"""
    try:
        # Get all active keywords sorted by priority (highest first)
        keywords = await db.keyword_replies.find({"is_active": True}).sort("priority", -1).to_list(None)
        
        for keyword in keywords:
            for trigger in keyword.get("keywords", []):
                if trigger.lower() in user_text.lower():
                    logger.info(f"Keyword match found: '{trigger}' in user text")
                    return keyword
        
        return None
    except Exception as e:
        logger.error(f"Error finding matching keyword: {str(e)}")
        return None

async def send_keyword_response(api, reply_token: str, keyword: dict):
    """Send response based on keyword message type"""
    try:
        message_type = keyword.get("message_type", "text")
        content = keyword.get("content", {})
        
        logger.info(f"Sending keyword response - Type: {message_type}")
        
        if message_type == "text":
            message = TextSendMessage(text=content.get("text", ""))
        elif message_type == "text_v2":
            # Text message v2 supports emojis and mentions
            text = content.get("text", "")
            emojis = content.get("emojis", [])
            message = TextSendMessage(text=text, emojis=emojis)
        elif message_type == "image":
            original_url = content.get("url", "")
            preview_url = content.get("preview_url", "")
            message = ImageSendMessage(
                original_content_url=original_url,
                preview_image_url=preview_url if preview_url else None
            )
        elif message_type == "video":
            original_url = content.get("url", "")
            preview_url = content.get("preview_url", "")
            message = VideoSendMessage(
                original_content_url=original_url,
                preview_image_url=preview_url if preview_url else None
            )
        elif message_type == "audio":
            original_url = content.get("url", "")
            duration = content.get("duration", 0)
            message = AudioSendMessage(
                original_content_url=original_url,
                duration=duration
            )
        elif message_type == "imagemap":
            base_url = content.get("base_url", "")
            alt_text = content.get("alt_text", "")
            base_size = content.get("base_size", {})
            actions = content.get("actions", [])
            message = ImagemapSendMessage(
                base_url=base_url,
                alt_text=alt_text,
                base_size=base_size,
                actions=actions
            )
        elif message_type == "template":
            template_type = content.get("template_type", "")
            alt_text = content.get("alt_text", "")
            template_data = content.get("template_data", {})
            
            if template_type == "buttons":
                message = TemplateSendMessage(
                    alt_text=alt_text,
                    template=ButtonsTemplate(
                        title=template_data.get("title", ""),
                        text=template_data.get("text", ""),
                        thumbnail_image_url=template_data.get("thumbnail_image_url", ""),
                        image_aspect_ratio=template_data.get("image_aspect_ratio", "rectangle"),
                        image_size=template_data.get("image_size", "cover"),
                        image_background_color=template_data.get("image_background_color", "#FFFFFF"),
                        actions=template_data.get("actions", [])
                    )
                )
            elif template_type == "confirm":
                message = TemplateSendMessage(
                    alt_text=alt_text,
                    template=ConfirmTemplate(
                        text=template_data.get("text", ""),
                        actions=template_data.get("actions", [])
                    )
                )
            elif template_type == "carousel":
                message = TemplateSendMessage(
                    alt_text=alt_text,
                    template=CarouselTemplate(
                        columns=template_data.get("columns", []),
                        image_aspect_ratio=template_data.get("image_aspect_ratio", "rectangle"),
                        image_size=template_data.get("image_size", "cover")
                    )
                )
            elif template_type == "image_carousel":
                message = TemplateSendMessage(
                    alt_text=alt_text,
                    template=ImageCarouselTemplate(
                        columns=template_data.get("columns", [])
                    )
                )
            else:
                message = TextSendMessage(text="Invalid template type")
        elif message_type == "sticker":
            package_id = content.get("package_id", "")
            sticker_id = content.get("sticker_id", "")
            message = StickerSendMessage(package_id=package_id, sticker_id=sticker_id)
        elif message_type == "location":
            title = content.get("title", "")
            address = content.get("address", "")
            latitude = float(content.get("latitude", 0))
            longitude = float(content.get("longitude", 0))
            message = LocationSendMessage(
                title=title,
                address=address,
                latitude=latitude,
                longitude=longitude
            )
        elif message_type == "flex":
            message = FlexSendMessage(alt_text="Keyword response", contents=content)
        else:
            logger.warning(f"Invalid message type: {message_type}")
            message = TextSendMessage(text="Invalid message type")
        
        api.reply_message(reply_token, message)
        logger.info(f"Keyword response sent successfully - Type: {message_type}")
        
    except Exception as e:
        logger.error(f"Error sending keyword response: {str(e)}")
        # Fallback to text message
        api.reply_message(reply_token, TextSendMessage(text="เกิดข้อผิดพลาดในการส่งข้อความ"))

async def handle_regular_message(event, user_id: str, text: str, api):
    """Handle regular (non-onboarding) messages with keyword matching"""
    
    # Check for keyword matches first
    matching_keyword = await find_matching_keyword(text)
    
    if matching_keyword:
        # Send keyword-based response
        logger.info(f"Keyword match found for user {user_id}: {matching_keyword.get('keywords', [])}")
        await send_keyword_response(api, event.reply_token, matching_keyword)
        
        # Track message statistics for analytics
        await track_message_statistics("reply", user_id, "keyword_response")
    elif text == "ข้อมูลปริมาณน้ำตาลในเลือดย้อนหลัง":
        # Send history selection flex message
        logger.info(f"History request from user {user_id}")
        flex_message = create_history_selection_flex()
        api.reply_message(event.reply_token, flex_message)
        logger.info(f"History selection sent to user {user_id}")
        
        # Track message statistics for analytics
        await track_message_statistics("reply", user_id, "history_request")
    else:
        # Default response
        logger.debug(f"Default response sent to user {user_id}")
        api.reply_message(
            event.reply_token,
            TextSendMessage(text="พิมพ์ 'ข้อมูลปริมาณน้ำตาลในเลือดย้อนหลัง' เพื่อดูประวัติการตรวจของคุณ")
        )
        
        # Track message statistics for analytics
        await track_message_statistics("reply", user_id, "default_response")

async def handle_postback(event):
    """Handle postback events (button clicks)"""
    user_id = event.source.user_id
    data = event.postback.data
    
    logger.info(f"Postback from user {user_id}: {data}")
    
    api = get_line_bot_api()
    if api is None:
        logger.error("LINE Bot API not initialized")
        return
    
    if data == "welcome_start":
        # Send history selection message
        logger.info(f"Welcome start button clicked by user {user_id}")
        flex_message = create_history_selection_flex()
        api.reply_message(event.reply_token, flex_message)
        logger.info(f"History selection sent to user {user_id} after welcome start")
    elif data.startswith("history_"):
        # Schedule async processing
        logger.info(f"History request from user {user_id}: {data}")
        import asyncio
        asyncio.create_task(process_history_request(event, user_id, data))
    elif data == "liff_apps":
        # Send LIFF apps selection
        logger.info(f"LIFF apps request from user {user_id}")
        liff_flex = await create_liff_buttons_flex()
        api.reply_message(event.reply_token, liff_flex)
        logger.info(f"LIFF apps selection sent to user {user_id}")
    elif data == "main_menu":
        # Send main menu
        logger.info(f"Main menu request from user {user_id}")
        main_menu_flex = create_main_menu_flex()
        api.reply_message(event.reply_token, main_menu_flex)
        logger.info(f"Main menu sent to user {user_id}")

async def process_history_request(event, user_id: str, data: str):
    """Process history request asynchronously"""
    period = data.replace("history_", "")
    logger.info(f"Processing history request for user {user_id}, period: {period}")
    
    # Calculate date range
    now = datetime.utcnow()
    if period == "weekly":
        start_date = now - timedelta(days=7)
    elif period == "monthly":
        start_date = now - timedelta(days=30)
    elif period == "3monthly":
        start_date = now - timedelta(days=90)
    elif period == "6monthly":
        start_date = now - timedelta(days=180)
    else:
        start_date = now - timedelta(days=30)
    
    logger.debug(f"Date range: {start_date} to {now}")
    
    # Get user readings from database
    readings = db.glucose_readings.find({
        "line_user_id": user_id,
        "measured_at": {"$gte": start_date}
    }).sort("measured_at", -1)
    
    readings_list = []
    async for reading in readings:
        readings_list.append(reading)
    
    logger.info(f"Found {len(readings_list)} readings for user {user_id}")
    
    # Calculate statistics
    if readings_list:
        values = [r['value_mg_dl'] for r in readings_list]
        stats = {
            'count': len(values),
            'avg': sum(values) / len(values),
            'min': min(values),
            'max': max(values)
        }
        logger.debug(f"Statistics for user {user_id}: {stats}")
    else:
        stats = {'count': 0, 'avg': 0, 'min': 0, 'max': 0}
        logger.info(f"No readings found for user {user_id}")
    
    # Send history summary flex message
    flex_message = create_history_summary_flex(user_id, period, readings_list, stats)
    api = get_line_bot_api()
    if api is not None:
        api.reply_message(event.reply_token, flex_message)
        logger.info(f"History summary sent to user {user_id} for period {period}")
    else:
        logger.error("LINE Bot API not initialized for history summary")

# Function to send glucose summary to user after submission
async def send_glucose_summary_to_user(user_id: str, reading: Dict[str, Any]):
    """Send glucose summary Flex message to user after data submission"""
    try:
        logger.info(f"Sending glucose summary to user {user_id}")
        flex_message = create_glucose_summary_flex(reading)
        api = get_line_bot_api()
        if api is not None:
            api.push_message(user_id, flex_message)
            logger.info(f"Glucose summary sent to user {user_id}")
            
            # Track message statistics for analytics
            await track_message_statistics("push", user_id, "glucose_summary")
        else:
            logger.error("LINE Bot API not initialized for glucose summary")
    except Exception as e:
        logger.error(f"Failed to send glucose summary to user {user_id}: {e}")

async def track_message_statistics(message_type: str, user_id: str, message_category: str):
    """Track LINE message statistics for analytics dashboard and update follower interaction count"""
    try:
        from datetime import datetime
        
        message_stats = {
            "message_type": message_type,
            "user_id": user_id,
            "category": message_category,
            "sent_at": datetime.utcnow(),
            "date": datetime.utcnow().date().isoformat(),
            "count": 1,
            "cost": 0.0  # LINE reply messages are free
        }
        
        # Store in message_analytics collection
        await db.message_analytics.insert_one(message_stats)
        
        # Update follower's interaction count and last_interaction timestamp
        await db.line_followers.update_one(
            {"line_user_id": user_id},
            {
                "$inc": {"interaction_count": 1},
                "$set": {"last_interaction": datetime.utcnow()}
            }
        )
        
        logger.debug(f"Message statistics tracked and interaction count updated: {message_type} to {user_id}")
    except Exception as e:
        logger.error(f"Error tracking message statistics: {e}")

# Function to send new user notification to Telegram
async def send_new_user_notification(user_id: str, user_info: Dict[str, Any]):
    """Send new user notification to Telegram admin bot"""
    try:
        logger.info(f"Sending new user notification for {user_id}")
        message = f"""
🆕 <b>ผู้ใช้ใหม่ลงทะเบียน</b>

👤 <b>User ID:</b> {user_id}
📝 <b>Display Name:</b> {user_info.get('display_name', 'N/A')}
📅 <b>วันที่ลงทะเบียน:</b> {datetime.utcnow().strftime('%d/%m/%Y %H:%M')}
        """
        send_telegram_notification(message)
        logger.info(f"New user notification sent for {user_id}")
    except Exception as e:
        logger.error(f"Failed to send new user notification: {e}")

# Event handler registrations
def register_event_handlers():
    """Register all event handlers with the webhook handler"""
    webhook_handler = get_webhook_handler()
    if webhook_handler is not None:
        # For async handlers, we need to wrap them to handle the async nature
        def sync_handle_follow(event):
            import asyncio
            asyncio.create_task(handle_follow(event))
        
        def sync_handle_text_message(event):
            import asyncio
            asyncio.create_task(handle_text_message(event))
        
        def sync_handle_postback(event):
            import asyncio
            asyncio.create_task(handle_postback(event))
        
        def sync_handle_unfollow(event):
            import asyncio
            asyncio.create_task(handle_unfollow(event))
        
        webhook_handler.add(FollowEvent)(sync_handle_follow)
        webhook_handler.add(MessageEvent, message=TextMessage)(sync_handle_text_message)
        webhook_handler.add(PostbackEvent)(sync_handle_postback)
        webhook_handler.add(UnfollowEvent)(sync_handle_unfollow)
        logger.info("Event handlers registered successfully")
    else:
        logger.error("Cannot register event handlers - webhook handler not initialized")
