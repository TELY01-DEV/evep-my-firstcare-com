import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Paper,
  Fade,
  Slide,
  Divider,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  Close,
  Chat,
  Help,
  Refresh,
  ExpandMore,
  ExpandLess,
  AutoAwesome,
  Psychology,
  Assessment,
  School,
  LocalHospital,
  Inventory,
  People,
  Analytics,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import unifiedApi from '../../services/unifiedApi';

interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: string;
  intent?: string;
  confidence?: number;
  suggestions?: string[];
  quick_actions?: Array<{
    label: string;
    action: string;
    path?: string;
    topic?: string;
  }>;
}

interface ChatBotInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
}

const ChatBotInterface: React.FC<ChatBotInterfaceProps> = ({
  isOpen,
  onClose,
  initialMessage,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sample suggestions based on user role (Bilingual: English and Thai)
  const getRoleBasedSuggestions = () => {
    const role = user?.role || 'user';
    
    const suggestionsMap = {
      parent: [
        "How do I view my child's screening results? / ดูผลการตรวจของลูกยังไง?",
        "Where can I find my child's health information? / หาข้อมูลสุขภาพของลูกได้ที่ไหน?",
        "How do I schedule appointments? / จัดตารางนัดหมายยังไง?",
        "What screening services are available? / มีบริการตรวจอะไรบ้าง?",
      ],
      teacher: [
        "How do I view student screening results? / ดูผลการตรวจนักเรียนยังไง?",
        "Where can I find student information? / หาข้อมูลนักเรียนได้ที่ไหน?",
        "How do I schedule screenings? / จัดตารางการตรวจยังไง?",
        "What screening types are available? / มีการตรวจแบบไหนบ้าง?",
      ],
      doctor: [
        "How do I start a vision screening? / วิธีเริ่มการตรวจสายตา?",
        "How do I interpret screening results? / ตีความผลการตรวจยังไง?",
        "What are the screening procedures? / ขั้นตอนการตรวจมีอะไรบ้าง?",
        "How do I access patient records? / เข้าถึงประวัติผู้ป่วยยังไง?",
      ],
      nurse: [
        "How do I start a vision screening? / วิธีเริ่มการตรวจสายตา?",
        "What equipment do I need for screening? / ต้องใช้อุปกรณ์อะไรในการตรวจ?",
        "How do I record screening results? / บันทึกผลการตรวจยังไง?",
        "Where can I find patient information? / หาข้อมูลผู้ป่วยได้ที่ไหน?",
      ],
      optometrist: [
        "How do I conduct comprehensive eye examinations? / ทำการตรวจตาอย่างละเอียดยังไง?",
        "How do I access visual acuity testing tools? / เข้าถึงเครื่องมือทดสอบความชัดเจนยังไง?",
        "How do I generate vision prescriptions? / สร้างใบสั่งแว่นตายังไง?",
        "Where can I find optometric diagnostic tools? / หาเครื่องมือวินิจฉัยทัศนมาตรได้ที่ไหน?",
      ],
      medical_staff: [
        "How do I manage patient care workflows? / จัดการขั้นตอนการดูแลผู้ป่วยยังไง?",
        "Where can I access medical screening tools? / เข้าถึงเครื่องมือตรวจคัดกรองได้ที่ไหน?",
        "How do I document medical procedures? / บันทึกขั้นตอนทางการแพทย์ยังไง?",
        "What patient management features are available? / มีฟีเจอร์จัดการผู้ป่วยอะไรบ้าง?",
      ],
      hospital_staff: [
        "How do I manage hospital operations? / จัดการการดำเนินงานของโรงพยาบาลยังไง?",
        "Where can I access hospital equipment? / เข้าถึงอุปกรณ์โรงพยาบาลได้ที่ไหน?",
        "How do I coordinate patient care? / ประสานงานการดูแลผู้ป่วยยังไง?",
        "What hospital workflow tools are available? / มีเครื่องมือขั้นตอนโรงพยาบาลอะไรบ้าง?",
      ],
      hospital_exclusive: [
        "How do I access specialized medical procedures? / เข้าถึงขั้นตอนทางการแพทย์เฉพาะทางยังไง?",
        "Where can I find advanced diagnostic tools? / หาเครื่องมือวินิจฉัยขั้นสูงได้ที่ไหน?",
        "How do I manage complex patient cases? / จัดการกรณีผู้ป่วยที่ซับซ้อนยังไง?",
        "What exclusive hospital services are available? / มีบริการพิเศษของโรงพยาบาลอะไรบ้าง?",
      ],
      medical_admin: [
        "How do I manage medical operations? / จัดการการดำเนินงานทางการแพทย์ยังไง?",
        "Where can I view medical quality metrics? / ดูตัวชี้วัดคุณภาพทางการแพทย์ได้ที่ไหน?",
        "How do I generate medical reports? / สร้างรายงานทางการแพทย์ยังไง?",
        "What medical administration tools are available? / มีเครื่องมือบริหารทางการแพทย์อะไรบ้าง?",
      ],
      system_admin: [
        "How do I manage system security? / จัดการความปลอดภัยของระบบยังไง?",
        "Where can I view system performance? / ดูประสิทธิภาพของระบบได้ที่ไหน?",
        "How do I configure system settings? / ตั้งค่าระบบยังไง?",
        "What system administration tools are available? / มีเครื่องมือบริหารระบบอะไรบ้าง?",
      ],
      super_admin: [
        "How do I manage user permissions? / จัดการสิทธิ์ผู้ใช้ยังไง?",
        "Where can I view system analytics? / ดูการวิเคราะห์ระบบได้ที่ไหน?",
        "How do I generate comprehensive reports? / สร้างรายงานที่ครอบคลุมยังไง?",
        "What are the advanced system settings? / การตั้งค่าระบบขั้นสูงมีอะไรบ้าง?",
      ],
      executive: [
        "How do I view strategic health analytics? / ดูการวิเคราะห์สุขภาพเชิงกลยุทธ์ยังไง?",
        "Where can I access performance metrics? / เข้าถึงตัวชี้วัดประสิทธิภาพได้ที่ไหน?",
        "How do I generate executive reports? / สร้างรายงานผู้บริหารยังไง?",
        "What strategic planning tools are available? / มีเครื่องมือวางแผนเชิงกลยุทธ์อะไรบ้าง?",
      ],
      admin: [
        "How do I manage user permissions? / จัดการสิทธิ์ผู้ใช้ยังไง?",
        "Where can I view system analytics? / ดูการวิเคราะห์ระบบได้ที่ไหน?",
        "How do I generate reports? / สร้างรายงานยังไง?",
        "What are the system settings? / การตั้งค่าระบบมีอะไรบ้าง?",
      ],
      default: [
        "How do I start a vision screening? / วิธีเริ่มการตรวจสายตา?",
        "Where can I find student information? / หาข้อมูลนักเรียนได้ที่ไหน?",
        "How do I check inventory status? / ตรวจสอบสถานะคลังสินค้ายังไง?",
        "What reports are available? / มีรายงานอะไรบ้าง?",
      ],
    };

    return suggestionsMap[role as keyof typeof suggestionsMap] || suggestionsMap.default;
  };

  useEffect(() => {
    if (isOpen) {
      // Initialize chat with welcome message (Bilingual)
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        message: `Hello ${user?.first_name || 'there'}! I'm your EVEP Medical Portal assistant. How can I help you today?\n\nสวัสดี ${user?.first_name || 'คุณ'}! ฉันเป็นผู้ช่วย EVEP Medical Portal ของคุณ วันนี้ฉันสามารถช่วยอะไรได้บ้าง?`,
        isUser: false,
        timestamp: new Date().toISOString(),
        suggestions: getRoleBasedSuggestions(),
      };
      
      setMessages([welcomeMessage]);
      setSuggestions(getRoleBasedSuggestions());
      setShowSuggestions(true);
      
      // Send initial message if provided
      if (initialMessage) {
        setTimeout(() => {
          handleSendMessage(initialMessage);
        }, 1000);
      }
    }
  }, [isOpen, user, initialMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message: message.trim(),
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      // Use the new AI agent endpoint for specialized responses
      const response = await unifiedApi.post('/api/v1/chat-bot/ai-agent', {
        message: message.trim(),
        context: {
          user_role: user?.role,
          user_id: user?.user_id,
        },
      });

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: response.data.response,
        isUser: false,
        timestamp: response.data.timestamp || new Date().toISOString(),
        intent: response.data.intent,
        confidence: response.data.confidence,
        suggestions: response.data.suggestions,
        quick_actions: response.data.quick_actions,
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Update conversation ID if provided
      if (response.data.conversation_id) {
        setConversationId(response.data.conversation_id);
      }
      
      // Show suggestions if available
      if (response.data.suggestions && response.data.suggestions.length > 0) {
        setSuggestions(response.data.suggestions);
        setShowSuggestions(true);
      }

    } catch (error) {
      console.error('AI Agent error:', error);
      
      // Fallback to basic chat if AI agent fails
      try {
        const fallbackResponse = await unifiedApi.post('/api/v1/chat-bot/chat', {
          message: message.trim(),
          conversation_id: conversationId,
          context: {
            user_role: user?.role,
            user_id: user?.user_id,
          },
        });

        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          message: fallbackResponse.data.response,
          isUser: false,
          timestamp: fallbackResponse.data.timestamp,
          intent: fallbackResponse.data.intent,
          confidence: fallbackResponse.data.confidence,
          suggestions: fallbackResponse.data.suggestions,
          quick_actions: fallbackResponse.data.quick_actions,
        };

        setMessages(prev => [...prev, botMessage]);
        setConversationId(fallbackResponse.data.conversation_id);
        
        if (fallbackResponse.data.suggestions && fallbackResponse.data.suggestions.length > 0) {
          setSuggestions(fallbackResponse.data.suggestions);
          setShowSuggestions(true);
        }
      } catch (fallbackError) {
        console.error('Fallback chat error:', fallbackError);
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          message: "I'm sorry, I encountered an error. Please try again or contact support if the issue persists.\n\nขออภัย ฉันพบข้อผิดพลาด กรุณาลองใหม่อีกครั้งหรือติดต่อฝ่ายสนับสนุนหากปัญหายังคงอยู่",
          isUser: false,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleQuickAction = (action: any) => {
    if (action.action === 'navigate' && action.path) {
      // Navigate to the specified path
      window.location.href = action.path;
    } else if (action.action === 'help' && action.topic) {
      // Send help request
      handleSendMessage(`Help with ${action.topic}`);
    }
  };

  const getIntentIcon = (intent?: string) => {
    switch (intent) {
      case 'screening_help':
        return <Assessment />;
      case 'inventory_query':
        return <Inventory />;
      case 'student_info':
        return <School />;
      case 'medical_team':
        return <LocalHospital />;
      case 'reports':
        return <Analytics />;
      default:
        return <Psychology />;
    }
  };

  const getIntentColor = (intent?: string) => {
    switch (intent) {
      case 'screening_help':
        return 'primary';
      case 'inventory_query':
        return 'secondary';
      case 'student_info':
        return 'success';
      case 'medical_team':
        return 'error';
      case 'reports':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: '600px',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        color: 'white',
      }}>
        <Box display="flex" alignItems="center">
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
            <SmartToy />
          </Avatar>
          <Box>
            <Typography variant="h6">EVEP Assistant / ผู้ช่วย EVEP</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Your Medical Portal Helper / ผู้ช่วยพอร์ทัลการแพทย์
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ flex: 1, p: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Messages */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {messages.map((message) => (
            <Fade in key={message.id}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                  mb: 2,
                }}
              >
                <Paper
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    backgroundColor: message.isUser 
                      ? 'primary.main' 
                      : 'grey.100',
                    color: message.isUser ? 'white' : 'text.primary',
                    borderRadius: message.isUser 
                      ? '20px 20px 5px 20px' 
                      : '20px 20px 20px 5px',
                  }}
                >
                  <Box display="flex" alignItems="flex-start" gap={1}>
                    {!message.isUser && (
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                        <SmartToy sx={{ fontSize: 16 }} />
                      </Avatar>
                    )}
                    <Box flex={1}>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.message}
                      </Typography>
                      
                      {!message.isUser && message.intent && (
                        <Box mt={1} display="flex" alignItems="center" gap={1}>
                          <Chip
                            icon={getIntentIcon(message.intent)}
                            label={message.intent.replace('_', ' ')}
                            size="small"
                            color={getIntentColor(message.intent) as any}
                            variant="outlined"
                          />
                          {message.confidence && (
                            <Typography variant="caption" color="text.secondary">
                              {Math.round(message.confidence * 100)}% confidence
                            </Typography>
                          )}
                        </Box>
                      )}
                      
                      {!message.isUser && message.quick_actions && message.quick_actions.length > 0 && (
                        <Box mt={2}>
                          <Typography variant="caption" color="text.secondary" gutterBottom>
                            Quick Actions:
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={1}>
                            {message.quick_actions.map((action, index) => (
                              <Button
                                key={index}
                                size="small"
                                variant="outlined"
                                startIcon={<AutoAwesome />}
                                onClick={() => handleQuickAction(action)}
                                sx={{ fontSize: '0.75rem' }}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Paper>
              </Box>
            </Fade>
          ))}
          
          {isLoading && (
            <Box display="flex" justifyContent="flex-start" mb={2}>
              <Paper sx={{ p: 2, backgroundColor: 'grey.100' }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                    <SmartToy sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    Thinking... / กำลังคิด...
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}
          
          <div ref={messagesEndRef} />
        </Box>

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <Slide direction="up" in={showSuggestions}>
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" gutterBottom>
                Suggested Questions: / คำถามแนะนำ:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {suggestions.map((suggestion, index) => (
                  <Chip
                    key={index}
                    label={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    variant="outlined"
                    clickable
                    sx={{ mb: 1 }}
                  />
                ))}
              </Box>
            </Box>
          </Slide>
        )}

        {/* Input */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              placeholder="Ask me anything about the medical portal... / ถามอะไรก็ได้เกี่ยวกับพอร์ทัลการแพทย์..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputMessage);
                }
              }}
              disabled={isLoading}
              multiline
              maxRows={3}
            />
            <IconButton
              onClick={() => handleSendMessage(inputMessage)}
              disabled={!inputMessage.trim() || isLoading}
              color="primary"
            >
              <Send />
            </IconButton>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ChatBotInterface;
