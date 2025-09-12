"""
LINE Message Service for EVEP Platform
Handles LINE message templates and formatting
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, Any, List, Optional

from app.core.database import get_database
from app.core.config import Config

class LineMessageService:
    """LINE Message Service for EVEP Platform"""
    
    def __init__(self):
        self.config = Config.get_module_config("line_integration")
        self.db = None
        self.message_templates = {
            "screening_reminder": {
                "annual": {
                    "title": "🔍 การตรวจสายตาประจำปี",
                    "message": "สวัสดีคุณ {name}\n\nถึงเวลาตรวจสายตาประจำปีแล้ว\nโปรดนัดหมายการตรวจกับเรา\n\n📞 ติดต่อ: 02-123-4567"
                },
                "followup": {
                    "title": "👁️ การตรวจติดตามผล",
                    "message": "สวัสดีคุณ {name}\n\nถึงเวลาตรวจติดตามผลการรักษาแล้ว\nโปรดนัดหมายการตรวจกับเรา\n\n📞 ติดต่อ: 02-123-4567"
                },
                "general": {
                    "title": "🔍 การตรวจสายตา",
                    "message": "สวัสดีคุณ {name}\n\nโปรดนัดหมายการตรวจสายตากับเรา\n\n📞 ติดต่อ: 02-123-4567"
                }
            },
            "screening_results": {
                "completed": {
                    "title": "✅ ผลการตรวจสายตา",
                    "message": "สวัสดีคุณ {parent_name}\n\nการตรวจสายตาของ {child_name} เสร็จสิ้นแล้ว\n\nผลการตรวจ: {results}\n\nโปรดติดต่อเราเพื่อรับคำแนะนำเพิ่มเติม\n\n📞 ติดต่อ: 02-123-4567"
                },
                "in_progress": {
                    "title": "⏳ การตรวจสายตา",
                    "message": "สวัสดีคุณ {parent_name}\n\nการตรวจสายตาของ {child_name} กำลังดำเนินการ\n\nเราจะแจ้งผลให้ทราบเมื่อเสร็จสิ้น\n\n📞 ติดต่อ: 02-123-4567"
                }
            },
            "appointment": {
                "confirmation": {
                    "title": "📅 ยืนยันการนัดหมาย",
                    "message": "สวัสดีคุณ {name}\n\nการนัดหมายของคุณได้รับการยืนยันแล้ว\n\n📅 วันที่: {date}\n⏰ เวลา: {time}\n📍 สถานที่: คลินิก EVEP\n\nโปรดมาถึงก่อนเวลานัดหมาย 15 นาที\n\n📞 ติดต่อ: 02-123-4567"
                },
                "reminder": {
                    "title": "⏰ เตือนการนัดหมาย",
                    "message": "สวัสดีคุณ {name}\n\nนี่เป็นการเตือนการนัดหมายของคุณ\n\n📅 วันที่: {date}\n⏰ เวลา: {time}\n📍 สถานที่: คลินิก EVEP\n\nโปรดมาถึงก่อนเวลานัดหมาย 15 นาที\n\n📞 ติดต่อ: 02-123-4567"
                }
            },
            "educational": {
                "vision_health": {
                    "title": "👁️ สุขภาพสายตา",
                    "message": "💡 เคล็ดลับสุขภาพสายตา\n\n• พักสายตาทุก 20 นาที\n• ดูหน้าจอในระยะที่เหมาะสม\n• รับประทานอาหารที่มีวิตามินเอ\n• ออกกำลังกายเป็นประจำ\n\nดูแลสายตาของคุณและครอบครัว"
                },
                "screen_time": {
                    "title": "📱 การใช้หน้าจอ",
                    "message": "📱 ข้อแนะนำการใช้หน้าจอ\n\n• เด็กอายุ 2-5 ปี: ไม่เกิน 1 ชั่วโมง/วัน\n• เด็กอายุ 6-12 ปี: ไม่เกิน 2 ชั่วโมง/วัน\n• พักสายตาทุก 20 นาที\n• ดูหน้าจอในที่ที่มีแสงเพียงพอ\n\nป้องกันปัญหาสายตาในเด็ก"
                }
            }
        }
    
    async def initialize(self) -> None:
        """Initialize the LINE Message service"""
        # Initialize database connection
        db_client = get_database()
        self.db = db_client.evep
        
        # Initialize message templates in database
        await self._initialize_message_templates()
        
        print("✅ LINE Message Service initialized")
    
    async def _initialize_message_templates(self) -> None:
        """Initialize message templates in database"""
        try:
            for template_type, templates in self.message_templates.items():
                for template_key, template_data in templates.items():
                    # Check if template already exists
                    existing = await self.db.line_message_templates.find_one({
                        "type": template_type,
                        "key": template_key
                    })
                    
                    if not existing:
                        # Create template
                        template_doc = {
                            "type": template_type,
                            "key": template_key,
                            "title": template_data["title"],
                            "message": template_data["message"],
                            "language": "th",
                            "is_active": True,
                            "created_at": datetime.utcnow(),
                            "updated_at": datetime.utcnow()
                        }
                        
                        await self.db.line_message_templates.insert_one(template_doc)
            
            print("✅ LINE message templates initialized")
            
        except Exception as e:
            print(f"Error initializing message templates: {e}")
    
    async def get_message_template(self, template_type: str, template_key: str) -> Optional[Dict[str, Any]]:
        """Get message template"""
        try:
            template = await self.db.line_message_templates.find_one({
                "type": template_type,
                "key": template_key,
                "is_active": True
            })
            
            return template
            
        except Exception as e:
            print(f"Error getting message template: {e}")
            return None
    
    async def format_message(self, template_type: str, template_key: str, variables: Dict[str, Any]) -> Optional[str]:
        """Format message with variables"""
        try:
            template = await self.get_message_template(template_type, template_key)
            if not template:
                return None
            
            message = template["message"]
            
            # Replace variables
            for var_name, var_value in variables.items():
                placeholder = f"{{{var_name}}}"
                message = message.replace(placeholder, str(var_value))
            
            return message
            
        except Exception as e:
            print(f"Error formatting message: {e}")
            return None
    
    async def create_message_template(self, template_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new message template"""
        try:
            # Validate required fields
            required_fields = ["type", "key", "title", "message"]
            for field in required_fields:
                if field not in template_data:
                    raise ValueError(f"Missing required field: {field}")
            
            # Check if template already exists
            existing = await self.db.line_message_templates.find_one({
                "type": template_data["type"],
                "key": template_data["key"]
            })
            
            if existing:
                raise ValueError(f"Template {template_data['type']}/{template_data['key']} already exists")
            
            # Create template
            template_doc = {
                "type": template_data["type"],
                "key": template_data["key"],
                "title": template_data["title"],
                "message": template_data["message"],
                "language": template_data.get("language", "th"),
                "is_active": template_data.get("is_active", True),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = await self.db.line_message_templates.insert_one(template_doc)
            
            return {
                "id": str(result.inserted_id),
                **template_doc
            }
            
        except Exception as e:
            print(f"Error creating message template: {e}")
            raise
    
    async def update_message_template(self, template_type: str, template_key: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update message template"""
        try:
            # Check if template exists
            existing = await self.db.line_message_templates.find_one({
                "type": template_type,
                "key": template_key
            })
            
            if not existing:
                raise ValueError(f"Template {template_type}/{template_key} not found")
            
            # Prepare update data
            update_data = {
                **updates,
                "updated_at": datetime.utcnow()
            }
            
            # Update template
            await self.db.line_message_templates.update_one(
                {"type": template_type, "key": template_key},
                {"$set": update_data}
            )
            
            # Get updated template
            updated = await self.db.line_message_templates.find_one({
                "type": template_type,
                "key": template_key
            })
            
            return updated
            
        except Exception as e:
            print(f"Error updating message template: {e}")
            raise
    
    async def delete_message_template(self, template_type: str, template_key: str) -> bool:
        """Delete message template"""
        try:
            result = await self.db.line_message_templates.delete_one({
                "type": template_type,
                "key": template_key
            })
            
            return result.deleted_count > 0
            
        except Exception as e:
            print(f"Error deleting message template: {e}")
            return False
    
    async def get_templates_by_type(self, template_type: str) -> List[Dict[str, Any]]:
        """Get all templates of a specific type"""
        try:
            templates = await self.db.line_message_templates.find({
                "type": template_type,
                "is_active": True
            }).to_list(None)
            
            return templates
            
        except Exception as e:
            print(f"Error getting templates by type: {e}")
            return []
    
    async def get_all_templates(self) -> List[Dict[str, Any]]:
        """Get all message templates"""
        try:
            templates = await self.db.line_message_templates.find({
                "is_active": True
            }).to_list(None)
            
            return templates
            
        except Exception as e:
            print(f"Error getting all templates: {e}")
            return []
    
    async def create_flex_message(self, template_type: str, template_key: str, variables: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create LINE Flex Message"""
        try:
            template = await self.get_message_template(template_type, template_key)
            if not template:
                return None
            
            # Format message
            message = await self.format_message(template_type, template_key, variables)
            if not message:
                return None
            
            # Create Flex Message structure
            flex_message = {
                "type": "bubble",
                "header": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "text",
                            "text": template["title"],
                            "weight": "bold",
                            "size": "lg",
                            "color": "#1DB446"
                        }
                    ]
                },
                "body": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "text",
                            "text": message,
                            "wrap": True,
                            "size": "sm",
                            "color": "#666666"
                        }
                    ]
                },
                "footer": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "button",
                            "action": {
                                "type": "uri",
                                "label": "ติดต่อเรา",
                                "uri": "tel:021234567"
                            },
                            "style": "primary",
                            "color": "#1DB446"
                        }
                    ]
                }
            }
            
            return flex_message
            
        except Exception as e:
            print(f"Error creating flex message: {e}")
            return None
    
    async def create_button_template(self, template_type: str, template_key: str, variables: Dict[str, Any], actions: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Create LINE Button Template"""
        try:
            template = await self.get_message_template(template_type, template_key)
            if not template:
                return None
            
            # Format message
            message = await self.format_message(template_type, template_key, variables)
            if not message:
                return None
            
            # Create Button Template
            button_template = {
                "type": "template",
                "altText": template["title"],
                "template": {
                    "type": "buttons",
                    "title": template["title"],
                    "text": message,
                    "actions": actions
                }
            }
            
            return button_template
            
        except Exception as e:
            print(f"Error creating button template: {e}")
            return None
    
    async def create_carousel_template(self, items: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Create LINE Carousel Template"""
        try:
            carousel_template = {
                "type": "template",
                "altText": "EVEP Platform",
                "template": {
                    "type": "carousel",
                    "columns": items
                }
            }
            
            return carousel_template
            
        except Exception as e:
            print(f"Error creating carousel template: {e}")
            return None
