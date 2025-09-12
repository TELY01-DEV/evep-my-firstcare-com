import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  CircularProgress,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Tabs,
  Tab,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PriorityHigh,
  Message,
  Image,
  VideoLibrary,
  ViewModule,
  FolderOpen,
  EmojiEmotions,
  LocationOn,
  TextFields,
  Code,
  Palette,
  EmojiEmotions as EmojiIcon,
  Add as AddIcon,
  Visibility,
  Map,
  VolumeUp,
  PlayArrow,
  Crop,
  CloudUpload,
  TableChart,
  Search,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { getBotKeywords, createBotKeyword, updateBotKeyword, deleteBotKeyword, getFlexMessagesByPurpose } from '../../api';
import { LINE_STICKER_PACKAGES, getLineStickerUrl } from '../data/lineStickers';
import MediaUploadManager from './MediaUploadManager.tsx';
import LocationSelector from './LocationSelector.tsx';
import AudioUploadManager from './AudioUploadManager.tsx';
import ImagemapEditor from './ImagemapEditor.tsx';
import TemplateMessageEditor from './TemplateMessageEditor.tsx';
import { useRBAC } from '../contexts/RBACContext';
import { useDateFormat } from '../hooks/useDateFormat';

interface KeywordReply {
  id?: string;
  keywords: string[];
  message_type: 'text' | 'text_v2' | 'flex' | 'video' | 'image' | 'audio' | 'sticker' | 'location' | 'imagemap' | 'template';
  content: any;
  conditions?: any;
  priority: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface FlexMessage {
  id: string;
  name: string;
  description: string;
  purpose: string;
  flex_message: any;
  alt_text: string;
  is_active: boolean;
}

interface EmojiData {
  index: number;
  productId: string;
  emojiId: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`keyword-tabpanel-${index}`}
      aria-labelledby={`keyword-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Official LINE Emoji packages from LINE Developers documentation
const LINE_EMOJI_PACKAGES = [
  { 
    id: '5ac1bfd5040ab15980c9b435', 
    name: 'LINE Friends',
    emojis: [
      { id: '001', name: 'Brown & Cony 1' },
      { id: '002', name: 'Brown & Cony 2' },
      { id: '003', name: 'Brown & Cony 3' },
      { id: '004', name: 'Brown & Cony 4' },
      { id: '005', name: 'Brown & Cony 5' },
      { id: '006', name: 'Brown & Cony 6' },
      { id: '007', name: 'Brown & Cony 7' },
      { id: '008', name: 'Brown & Cony 8' },
      { id: '009', name: 'Brown & Cony 9' },
      { id: '010', name: 'Brown & Cony 10' },
      { id: '011', name: 'Brown & Cony 11' },
      { id: '012', name: 'Brown & Cony 12' },
      { id: '013', name: 'Brown & Cony 13' },
      { id: '014', name: 'Brown & Cony 14' },
      { id: '015', name: 'Brown & Cony 15' },
      { id: '016', name: 'Brown & Cony 16' },
      { id: '017', name: 'Brown & Cony 17' },
      { id: '018', name: 'Brown & Cony 18' },
      { id: '019', name: 'Brown & Cony 19' },
      { id: '020', name: 'Brown & Cony 20' },
      { id: '021', name: 'Brown & Cony 21' },
      { id: '022', name: 'Brown & Cony 22' },
      { id: '023', name: 'Brown & Cony 23' },
      { id: '024', name: 'Brown & Cony 24' },
      { id: '025', name: 'Brown & Cony 25' },
      { id: '026', name: 'Brown & Cony 26' },
      { id: '027', name: 'Brown & Cony 27' },
      { id: '028', name: 'Brown & Cony 28' },
      { id: '029', name: 'Brown & Cony 29' },
      { id: '030', name: 'Brown & Cony 30' },
      { id: '031', name: 'Brown & Cony 31' },
      { id: '032', name: 'Brown & Cony 32' },
      { id: '033', name: 'Brown & Cony 33' },
      { id: '034', name: 'Brown & Cony 34' },
      { id: '035', name: 'Brown & Cony 35' },
      { id: '036', name: 'Brown & Cony 36' },
      { id: '037', name: 'Brown & Cony 37' },
      { id: '038', name: 'Brown & Cony 38' },
      { id: '039', name: 'Brown & Cony 39' },
      { id: '040', name: 'Brown & Cony 40' }
    ]
  },
  { 
    id: '5ac1de17040ab15980c9b438', 
    name: 'LINE Friends 2',
    emojis: [
      { id: '001', name: 'Brown & Cony 2-1' },
      { id: '002', name: 'Brown & Cony 2-2' },
      { id: '003', name: 'Brown & Cony 2-3' },
      { id: '004', name: 'Brown & Cony 2-4' },
      { id: '005', name: 'Brown & Cony 2-5' },
      { id: '006', name: 'Brown & Cony 2-6' },
      { id: '007', name: 'Brown & Cony 2-7' },
      { id: '008', name: 'Brown & Cony 2-8' },
      { id: '009', name: 'Brown & Cony 2-9' },
      { id: '010', name: 'Brown & Cony 2-10' },
      { id: '011', name: 'Brown & Cony 2-11' },
      { id: '012', name: 'Brown & Cony 2-12' },
      { id: '013', name: 'Brown & Cony 2-13' },
      { id: '014', name: 'Brown & Cony 2-14' },
      { id: '015', name: 'Brown & Cony 2-15' },
      { id: '016', name: 'Brown & Cony 2-16' },
      { id: '017', name: 'Brown & Cony 2-17' },
      { id: '018', name: 'Brown & Cony 2-18' },
      { id: '019', name: 'Brown & Cony 2-19' },
      { id: '020', name: 'Brown & Cony 2-20' },
      { id: '021', name: 'Brown & Cony 2-21' },
      { id: '022', name: 'Brown & Cony 2-22' },
      { id: '023', name: 'Brown & Cony 2-23' },
      { id: '024', name: 'Brown & Cony 2-24' },
      { id: '025', name: 'Brown & Cony 2-25' },
      { id: '026', name: 'Brown & Cony 2-26' },
      { id: '027', name: 'Brown & Cony 2-27' },
      { id: '028', name: 'Brown & Cony 2-28' },
      { id: '029', name: 'Brown & Cony 2-29' },
      { id: '030', name: 'Brown & Cony 2-30' },
      { id: '031', name: 'Brown & Cony 2-31' },
      { id: '032', name: 'Brown & Cony 2-32' },
      { id: '033', name: 'Brown & Cony 2-33' },
      { id: '034', name: 'Brown & Cony 2-34' },
      { id: '035', name: 'Brown & Cony 2-35' },
      { id: '036', name: 'Brown & Cony 2-36' },
      { id: '037', name: 'Brown & Cony 2-37' },
      { id: '038', name: 'Brown & Cony 2-38' },
      { id: '039', name: 'Brown & Cony 2-39' },
      { id: '040', name: 'Brown & Cony 2-40' }
    ]
  },
  { 
    id: '670e0cce840a8236ddd4ee4c', 
    name: 'LINE Emoji 2022',
    emojis: [
      { id: '001', name: 'Emoji 2022-1' },
      { id: '002', name: 'Emoji 2022-2' },
      { id: '003', name: 'Emoji 2022-3' },
      { id: '004', name: 'Emoji 2022-4' },
      { id: '005', name: 'Emoji 2022-5' },
      { id: '006', name: 'Emoji 2022-6' },
      { id: '007', name: 'Emoji 2022-7' },
      { id: '008', name: 'Emoji 2022-8' },
      { id: '009', name: 'Emoji 2022-9' },
      { id: '010', name: 'Emoji 2022-10' },
      { id: '011', name: 'Emoji 2022-11' },
      { id: '012', name: 'Emoji 2022-12' },
      { id: '013', name: 'Emoji 2022-13' },
      { id: '014', name: 'Emoji 2022-14' },
      { id: '015', name: 'Emoji 2022-15' },
      { id: '016', name: 'Emoji 2022-16' },
      { id: '017', name: 'Emoji 2022-17' },
      { id: '018', name: 'Emoji 2022-18' },
      { id: '019', name: 'Emoji 2022-19' },
      { id: '020', name: 'Emoji 2022-20' },
      { id: '021', name: 'Emoji 2022-21' },
      { id: '022', name: 'Emoji 2022-22' },
      { id: '023', name: 'Emoji 2022-23' },
      { id: '024', name: 'Emoji 2022-24' },
      { id: '025', name: 'Emoji 2022-25' },
      { id: '026', name: 'Emoji 2022-26' },
      { id: '027', name: 'Emoji 2022-27' },
      { id: '028', name: 'Emoji 2022-28' },
      { id: '029', name: 'Emoji 2022-29' },
      { id: '030', name: 'Emoji 2022-30' },
      { id: '031', name: 'Emoji 2022-31' },
      { id: '032', name: 'Emoji 2022-32' },
      { id: '033', name: 'Emoji 2022-33' },
      { id: '034', name: 'Emoji 2022-34' },
      { id: '035', name: 'Emoji 2022-35' },
      { id: '036', name: 'Emoji 2022-36' },
      { id: '037', name: 'Emoji 2022-37' },
      { id: '038', name: 'Emoji 2022-38' },
      { id: '039', name: 'Emoji 2022-39' },
      { id: '040', name: 'Emoji 2022-40' }
    ]
  },
  { 
    id: '5ac2213e040ab15980c9b447', 
    name: 'LINE Emoji 3',
    emojis: [
      { id: '001', name: 'Emoji 3-1' },
      { id: '002', name: 'Emoji 3-2' },
      { id: '003', name: 'Emoji 3-3' },
      { id: '004', name: 'Emoji 3-4' },
      { id: '005', name: 'Emoji 3-5' },
      { id: '006', name: 'Emoji 3-6' },
      { id: '007', name: 'Emoji 3-7' },
      { id: '008', name: 'Emoji 3-8' },
      { id: '009', name: 'Emoji 3-9' },
      { id: '010', name: 'Emoji 3-10' },
      { id: '011', name: 'Emoji 3-11' },
      { id: '012', name: 'Emoji 3-12' },
      { id: '013', name: 'Emoji 3-13' },
      { id: '014', name: 'Emoji 3-14' },
      { id: '015', name: 'Emoji 3-15' },
      { id: '016', name: 'Emoji 3-16' },
      { id: '017', name: 'Emoji 3-17' },
      { id: '018', name: 'Emoji 3-18' },
      { id: '019', name: 'Emoji 3-19' },
      { id: '020', name: 'Emoji 3-20' },
      { id: '021', name: 'Emoji 3-21' },
      { id: '022', name: 'Emoji 3-22' },
      { id: '023', name: 'Emoji 3-23' },
      { id: '024', name: 'Emoji 3-24' },
      { id: '025', name: 'Emoji 3-25' },
      { id: '026', name: 'Emoji 3-26' },
      { id: '027', name: 'Emoji 3-27' },
      { id: '028', name: 'Emoji 3-28' },
      { id: '029', name: 'Emoji 3-29' },
      { id: '030', name: 'Emoji 3-30' },
      { id: '031', name: 'Emoji 3-31' },
      { id: '032', name: 'Emoji 3-32' },
      { id: '033', name: 'Emoji 3-33' },
      { id: '034', name: 'Emoji 3-34' },
      { id: '035', name: 'Emoji 3-35' },
      { id: '036', name: 'Emoji 3-36' },
      { id: '037', name: 'Emoji 3-37' },
      { id: '038', name: 'Emoji 3-38' },
      { id: '039', name: 'Emoji 3-39' },
      { id: '040', name: 'Emoji 3-40' }
    ]
  },
  { 
    id: '5ac21a8c040ab15980c9b43f', 
    name: 'LINE Emoji 4',
    emojis: [
      { id: '001', name: 'Emoji 4-1' },
      { id: '002', name: 'Emoji 4-2' },
      { id: '003', name: 'Emoji 4-3' },
      { id: '004', name: 'Emoji 4-4' },
      { id: '005', name: 'Emoji 4-5' },
      { id: '006', name: 'Emoji 4-6' },
      { id: '007', name: 'Emoji 4-7' },
      { id: '008', name: 'Emoji 4-8' },
      { id: '009', name: 'Emoji 4-9' },
      { id: '010', name: 'Emoji 4-10' },
      { id: '011', name: 'Emoji 4-11' },
      { id: '012', name: 'Emoji 4-12' },
      { id: '013', name: 'Emoji 4-13' },
      { id: '014', name: 'Emoji 4-14' },
      { id: '015', name: 'Emoji 4-15' },
      { id: '016', name: 'Emoji 4-16' },
      { id: '017', name: 'Emoji 4-17' },
      { id: '018', name: 'Emoji 4-18' },
      { id: '019', name: 'Emoji 4-19' },
      { id: '020', name: 'Emoji 4-20' },
      { id: '021', name: 'Emoji 4-21' },
      { id: '022', name: 'Emoji 4-22' },
      { id: '023', name: 'Emoji 4-23' },
      { id: '024', name: 'Emoji 4-24' },
      { id: '025', name: 'Emoji 4-25' },
      { id: '026', name: 'Emoji 4-26' },
      { id: '027', name: 'Emoji 4-27' },
      { id: '028', name: 'Emoji 4-28' },
      { id: '029', name: 'Emoji 4-29' },
      { id: '030', name: 'Emoji 4-30' },
      { id: '031', name: 'Emoji 4-31' },
      { id: '032', name: 'Emoji 4-32' },
      { id: '033', name: 'Emoji 4-33' },
      { id: '034', name: 'Emoji 4-34' },
      { id: '035', name: 'Emoji 4-35' },
      { id: '036', name: 'Emoji 4-36' },
      { id: '037', name: 'Emoji 4-37' },
      { id: '038', name: 'Emoji 4-38' },
      { id: '039', name: 'Emoji 4-39' },
      { id: '040', name: 'Emoji 4-40' }
    ]
  }
];

// LINE Sticker packages are now imported from '../data/lineStickers'

// Function to get LINE emoji image URL using official CDN
const getLineEmojiUrl = (productId: string, emojiId: string) => {
  // Correct LINE emoji CDN URL format from official documentation
  return `https://stickershop.line-scdn.net/sticonshop/v1/sticon/${productId}/android/${emojiId}.png?v=1`;
};

// getLineStickerUrl function is now imported from '../data/lineStickers'

// Function to get fallback emoji color based on emoji ID
const getEmojiColor = (emojiId: string) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  const index = parseInt(emojiId) % colors.length;
  return colors[index];
};

// Function to get fallback sticker color based on sticker ID
const getStickerColor = (stickerId: string) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  const index = parseInt(stickerId) % colors.length;
  return colors[index];
};

const KeywordReplyManager: React.FC = () => {
  const [keywords, setKeywords] = useState<KeywordReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<KeywordReply | null>(null);
  const [formData, setFormData] = useState<KeywordReply>({
    keywords: [],
    message_type: 'text',
    content: { text: '' },
    priority: 0,
    is_active: true
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Flex Message Selector states
  const [botReplyFlexMessages, setBotReplyFlexMessages] = useState<FlexMessage[]>([]);
  const [selectedFlexMessageId, setSelectedFlexMessageId] = useState<string>('');
  const [showFlexMessageSelector, setShowFlexMessageSelector] = useState(false);
  const [flexMessageLoading, setFlexMessageLoading] = useState(false);

  // Visual Template System states
  const [templateTabValue, setTemplateTabValue] = useState(0);

  // Emoji Selector states
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const [emojiIndex, setEmojiIndex] = useState<number>(0);

  // Sticker Selector states
  const [showStickerSelector, setShowStickerSelector] = useState(false);
  const [stickerSearchTerm, setStickerSearchTerm] = useState('');

  // Media Upload Manager states
  const [showMediaUploadManager, setShowMediaUploadManager] = useState(false);
  const [mediaUploadType, setMediaUploadType] = useState<'image' | 'video'>('image');
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  // Audio Upload Manager states
  const [showAudioUploadManager, setShowAudioUploadManager] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState<any>(null);
  const [showImagemapEditor, setShowImagemapEditor] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  // Location Selector states
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  // View mode state
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Sort state
  const [sortBy, setSortBy] = useState<string>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter section state
  const [filterSectionExpanded, setFilterSectionExpanded] = useState<boolean>(false);

  // RBAC context
  const { canPerform } = useRBAC();
  const { formatDate } = useDateFormat();

  // Helper function to get flex message name by matching content
  const getFlexMessageName = (content: any): string => {
    if (!content) return 'Unknown Flex Message';
    
    // Try to find matching flex message by content
    const matchingFlexMessage = botReplyFlexMessages.find(msg => 
      JSON.stringify(msg.flex_message) === JSON.stringify(content)
    );
    
    if (matchingFlexMessage) {
      return matchingFlexMessage.name;
    }
    
    // Fallback to content type if no match found
    return content?.type === 'bubble' ? 
      `Flex Bubble: ${content?.body?.contents?.[0]?.text || 'No text'}` :
      content?.type === 'carousel' ? 
        `Flex Carousel: ${content?.contents?.length || 0} bubbles` :
        `Flex Message: ${content?.type || 'Unknown type'}`;
  };

  // Function to get available (unused) flex messages
  const getAvailableFlexMessages = () => {
    // Get all flex messages that are not currently used by any keyword reply
    return botReplyFlexMessages.filter(flexMessage => {
      // Check if this flex message is already used by any keyword reply
      const isUsed = keywords.some(keyword => 
        keyword.message_type === 'flex' && 
        JSON.stringify(keyword.content) === JSON.stringify(flexMessage.flex_message)
      );
      return !isUsed; // Return only unused flex messages
    });
  };

  // Filter function to process keywords based on search and filters
  const filteredKeywords = keywords.filter(keyword => {
    // Search term filter
    const searchMatch = searchTerm === '' || 
      keyword.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase())) ||
      keyword.message_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getFlexMessageName(keyword.content).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (keyword.content?.text && keyword.content.text.toLowerCase().includes(searchTerm.toLowerCase()));

    // Message type filter
    const typeMatch = filterType === 'all' || keyword.message_type === filterType;

    // Status filter
    const statusMatch = filterStatus === 'all' || 
      (filterStatus === 'active' && keyword.is_active) ||
      (filterStatus === 'inactive' && !keyword.is_active);

    // Priority filter
    const priorityMatch = filterPriority === 'all' || 
      (filterPriority === 'high' && keyword.priority >= 8) ||
      (filterPriority === 'medium' && keyword.priority >= 4 && keyword.priority < 8) ||
      (filterPriority === 'low' && keyword.priority < 4);

    return searchMatch && typeMatch && statusMatch && priorityMatch;
  }).sort((a, b) => {
    // Sort the filtered results
    let aValue: any, bValue: any;

    switch (sortBy) {
      case 'updated_at':
        aValue = a.updated_at || '';
        bValue = b.updated_at || '';
        break;
      case 'created_at':
        aValue = a.created_at || '';
        bValue = b.created_at || '';
        break;
      case 'priority':
        aValue = a.priority || 0;
        bValue = b.priority || 0;
        break;
      case 'keywords':
        aValue = a.keywords.join(', ').toLowerCase();
        bValue = b.keywords.join(', ').toLowerCase();
        break;
      case 'message_type':
        aValue = a.message_type.toLowerCase();
        bValue = b.message_type.toLowerCase();
        break;
      default:
        aValue = a.updated_at || '';
        bValue = b.updated_at || '';
    }

    // Handle date sorting
    if (sortBy === 'updated_at' || sortBy === 'created_at') {
      const aDate = new Date(aValue).getTime();
      const bDate = new Date(bValue).getTime();
      return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
    }

    // Handle string sorting
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    }

    // Handle number sorting
    if (sortOrder === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  useEffect(() => {
    loadKeywords();
    loadBotReplyFlexMessages(); // Load flex messages on component mount
    
    // Debug: Log sticker packages
    console.log('LINE_STICKER_PACKAGES loaded:', LINE_STICKER_PACKAGES.length, 'packages');
    LINE_STICKER_PACKAGES.forEach((pkg, index) => {
      console.log(`Package ${index + 1}: ${pkg.name} (${pkg.stickers.length} stickers)`);
    });
  }, []);

  useEffect(() => {
    if (formData.message_type === 'flex') {
      loadBotReplyFlexMessages();
    }
  }, [formData.message_type]);

  const loadKeywords = async () => {
    try {
      setLoading(true);
      const response = await getBotKeywords();
      setKeywords(response.data.keywords || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load keyword replies');
    } finally {
      setLoading(false);
    }
  };

  const loadBotReplyFlexMessages = async () => {
    try {
      setFlexMessageLoading(true);
      const response = await getFlexMessagesByPurpose("bot_reply");
      setBotReplyFlexMessages(response.data || []);
    } catch (err: any) {
      console.error('Failed to load flex messages:', err);
      setBotReplyFlexMessages([]);
    } finally {
      setFlexMessageLoading(false);
    }
  };

  const handleOpenDialog = async (keyword?: KeywordReply) => {
    if (keyword) {
      setEditingKeyword(keyword);
      setFormData(keyword);
      
      // If editing a flex message, ensure flex messages are loaded and find the match
      if (keyword.message_type === 'flex' && keyword.content) {
        // Load flex messages if not already loaded
        if (botReplyFlexMessages.length === 0) {
          await loadBotReplyFlexMessages();
        }
        
        // Find the flex message that matches the content
        console.log('🔍 Searching for matching flex message...');
        console.log('🔍 Keyword content:', keyword.content);
        console.log('🔍 Available flex messages:', botReplyFlexMessages.length);
        
        const matchingFlexMessage = botReplyFlexMessages.find(msg => {
          const isMatch = JSON.stringify(msg.flex_message) === JSON.stringify(keyword.content);
          console.log(`🔍 Comparing with ${msg.name}:`, isMatch);
          return isMatch;
        });
        
        if (matchingFlexMessage) {
          console.log('✅ Found matching flex message:', matchingFlexMessage.name);
          setSelectedFlexMessageId(matchingFlexMessage.id);
        } else {
          console.log('❌ No matching flex message found');
          setSelectedFlexMessageId(''); // No match found
        }
      } else {
        setSelectedFlexMessageId(''); // Not a flex message
      }
    } else {
      setEditingKeyword(null);
      setFormData({
        keywords: [],
        message_type: 'text',
        content: { text: '' },
        priority: 0,
        is_active: true
      });
      setSelectedFlexMessageId('');
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingKeyword(null);
    setFormData({
      keywords: [],
      message_type: 'text',
      content: { text: '' },
      priority: 0,
      is_active: true
    });
    setSelectedFlexMessageId('');
    setShowFlexMessageSelector(false);
    setTemplateTabValue(0);
    setShowEmojiSelector(false);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (editingKeyword?.id) {
        await updateBotKeyword(editingKeyword.id, formData);
        setSuccess('Keyword reply updated successfully!');
      } else {
        await createBotKeyword(formData);
        setSuccess('Keyword reply created successfully!');
      }
      
      handleCloseDialog();
      loadKeywords();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save keyword reply');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this keyword reply? This will also remove any associated media files.')) {
      try {
        setLoading(true);
        const response = await deleteBotKeyword(id);
        
        // Check if files were cleaned up
        const filesCleaned = response.data?.files_cleaned || 0;
        if (filesCleaned > 0) {
          setSuccess(`Keyword reply deleted successfully! Also cleaned up ${filesCleaned} associated media file(s).`);
        } else {
          setSuccess('Keyword reply deleted successfully!');
        }
        
        loadKeywords();
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to delete keyword reply');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeywordsChange = (value: string) => {
    const keywordsArray = value.split(',').map(k => k.trim()).filter(k => k);
    setFormData(prev => ({ ...prev, keywords: keywordsArray }));
  };

  const handleFlexMessageSelect = (flexMessageId: string) => {
    setSelectedFlexMessageId(flexMessageId);
    const selectedMessage = botReplyFlexMessages.find(msg => msg.id === flexMessageId);
    if (selectedMessage) {
      setFormData(prev => ({
        ...prev,
        content: selectedMessage.flex_message
      }));
    }
  };

  const handleFlexMessageSelectorOpen = () => {
    setShowFlexMessageSelector(true);
  };

  const handleFlexMessageSelectorClose = () => {
    setShowFlexMessageSelector(false);
  };

  const handleFlexMessageFromSelector = (flexMessage: FlexMessage) => {
    setSelectedFlexMessageId(flexMessage.id);
    setFormData(prev => ({
      ...prev,
      content: flexMessage.flex_message
    }));
    setShowFlexMessageSelector(false);
  };

  const handleTemplateTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTemplateTabValue(newValue);
  };

  const handleEmojiSelectorOpen = () => {
    setShowEmojiSelector(true);
  };

  const handleEmojiSelectorClose = () => {
    setShowEmojiSelector(false);
  };

  const handleAddEmoji = (productId: string, emojiId: string) => {
    const currentEmojis = formData.content?.emojis || [];
    const newEmoji: EmojiData = {
      index: emojiIndex,
      productId,
      emojiId
    };
    
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        emojis: [...currentEmojis, newEmoji]
      }
    }));
    
    setShowEmojiSelector(false);
  };

  const handleStickerSelectorClose = () => {
    setShowStickerSelector(false);
    setStickerSearchTerm('');
  };

  const handleAddSticker = (packageId: string, stickerId: string) => {
    setFormData(prev => ({
      ...prev,
      content: {
        type: 'sticker',
        packageId,
        stickerId
      }
    }));

    setShowStickerSelector(false);
  };

  const handleMediaSelect = (media: any) => {
    setSelectedMedia(media);
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        url: media.url,
        preview_url: media.preview_url || ''
      }
    }));
    setShowMediaUploadManager(false);
  };

  const handleMediaUploadManagerOpen = (type: 'image' | 'video') => {
    setMediaUploadType(type);
    setShowMediaUploadManager(true);
  };

  const handleAudioSelect = (audio: any) => {
    setSelectedAudio(audio);
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        url: audio.url,
        duration: 0 // Will be set by the user or calculated
      }
    }));
    setShowAudioUploadManager(false);
  };

  const handleAudioUploadManagerOpen = () => {
    setShowAudioUploadManager(true);
  };

  const handleImagemapEditorOpen = () => {
    setShowImagemapEditor(true);
  };

  const handleImagemapSave = (imagemap: any) => {
    setFormData(prev => ({
      ...prev,
      content: {
        base_url: imagemap.baseUrl,
        alt_text: imagemap.altText,
        base_size: imagemap.baseSize,
        actions: imagemap.actions
      }
    }));
    setShowImagemapEditor(false);
  };

  const handleImagemapImageUpload = () => {
    // Trigger the file input in the imagemap editor
    document.getElementById('image-file-input')?.click();
  };

  const handleTemplateEditorOpen = () => {
    setShowTemplateEditor(true);
  };

  const handleTemplateSave = (template: any) => {
    setFormData(prev => ({
      ...prev,
      content: {
        template_type: template.templateType,
        alt_text: template.altText,
        template_data: template.templateData
      }
    }));
    setShowTemplateEditor(false);
  };

  const handlePlayAudioInForm = (audioUrl: string) => {
    // Create a temporary audio element to play the audio
    const audio = new Audio(audioUrl);
    audio.preload = 'metadata';
    
    audio.addEventListener('error', () => {
      console.error('Failed to play audio file');
      // You could add a toast notification here
    });
    
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      // You could add a toast notification here
    });
  };

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        title: location.title,
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude
      }
    }));
    setShowLocationSelector(false);
  };

  const handleLocationSelectorOpen = () => {
    setShowLocationSelector(true);
  };

  const handleRemoveEmoji = (index: number) => {
                                const currentEmojis = formData.content?.emojis || [];
                            const updatedEmojis = currentEmojis.filter((_: any, i: number) => i !== index);
    
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        emojis: updatedEmojis
      }
    }));
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <Message />;
      case 'text_v2': return <TextFields />;
      case 'image': return <Image />;
      case 'video': return <VideoLibrary />;
      case 'audio': return <VolumeUp />;
      case 'imagemap': return <Crop />;
      case 'template': return <ViewModule />;
      case 'flex': return <ViewModule />;
      case 'sticker': return <EmojiEmotions />;
      case 'location': return <LocationOn />;
      default: return <Message />;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'error';
    if (priority >= 5) return 'warning';
    return 'success';
  };

  const getDefaultContent = (messageType: string) => {
    switch (messageType) {
      case 'text':
        return { text: '' };
      case 'text_v2':
        return { text: '', emojis: [] };
      case 'image':
        return { url: '', preview_url: '' };
      case 'video':
        return { url: '', preview_url: '' };
      case 'audio':
        return { url: '', duration: 0 };
      case 'imagemap':
        return { 
          base_url: '', 
          alt_text: '', 
          base_size: { width: 1040, height: 1040 }, 
          actions: [] 
        };
      case 'template':
        return { 
          template_type: 'buttons',
          alt_text: '',
          template_data: {
            title: '',
            text: '',
            actions: []
          }
        };
      case 'sticker':
        return { package_id: '', sticker_id: '' };
      case 'location':
        return { title: '', address: '', latitude: '', longitude: '' };
      case 'flex':
        return {};
      default:
        return {};
    }
  };

  const renderVisualTemplate = () => {
    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Keywords (comma-separated)"
              value={formData.keywords.join(', ')}
              onChange={(e) => handleKeywordsChange(e.target.value)}
              helperText="Enter keywords separated by commas (e.g., hello, hi, hey)"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Message Type</InputLabel>
              <Select
                value={formData.message_type}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  message_type: e.target.value as any,
                  content: getDefaultContent(e.target.value)
                }))}
                label="Message Type"
              >
                <MenuItem value="text">Text Message</MenuItem>
                <MenuItem value="text_v2">Text Message (v2)</MenuItem>
                <MenuItem value="image">Image Message</MenuItem>
                <MenuItem value="video">Video Message</MenuItem>
                <MenuItem value="audio">Audio Message</MenuItem>
                <MenuItem value="imagemap">Imagemap Message</MenuItem>
                <MenuItem value="template">Template Message</MenuItem>
                <MenuItem value="sticker">Sticker Message</MenuItem>
                {canPerform('manage_location_messages') && (
                  <MenuItem value="location">Location Message</MenuItem>
                )}
                <MenuItem value="flex">Flex Message</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Priority"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                priority: parseInt(e.target.value) || 0 
              }))}
              helperText="Higher priority keywords are checked first"
              inputProps={{ min: 0, max: 10 }}
            />
          </Grid>

          <Grid item xs={12}>
            {formData.message_type === 'text' && (
              <TextField
                fullWidth
                label="Message Text"
                multiline
                rows={4}
                value={formData.content?.text || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  content: { ...prev.content, text: e.target.value }
                }))}
                helperText="Enter the text message to send when keywords are matched"
              />
            )}

            {formData.message_type === 'text_v2' && (
              <Box>
                <TextField
                  fullWidth
                  label="Message Text"
                  multiline
                  rows={4}
                  value={formData.content?.text || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    content: { ...prev.content, text: e.target.value }
                  }))}
                  helperText="Enter the text message (v2 supports emojis and mentions)"
                  sx={{ mb: 2 }}
                />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Emojis ({formData.content?.emojis?.length || 0} added)
                  </Typography>
                  
                  {formData.content?.emojis?.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {formData.content.emojis.map((emoji: EmojiData, index: number) => (
                        <Chip
                          key={index}
                          avatar={
                            <Avatar sx={{ width: 20, height: 20 }}>
                              <img 
                                src={getLineEmojiUrl(emoji.productId, emoji.emojiId)}
                                alt={`${emoji.productId}/${emoji.emojiId}`}
                                style={{ width: '16px', height: '16px' }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) {
                                    fallback.style.display = 'flex';
                                    fallback.style.backgroundColor = getEmojiColor(emoji.emojiId);
                                  }
                                }}
                              />
                              <Box 
                                sx={{ 
                                  width: '16px', 
                                  height: '16px', 
                                  display: 'none',
                                  backgroundColor: getEmojiColor(emoji.emojiId),
                                  borderRadius: '50%',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: '0.6rem'
                                }}
                              >
                                {emoji.emojiId}
                              </Box>
                            </Avatar>
                          }
                          label={`${emoji.productId}/${emoji.emojiId} (pos: ${emoji.index})`}
                          onDelete={() => handleRemoveEmoji(index)}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      No emojis added yet
                    </Typography>
                  )}
                  
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleEmojiSelectorOpen}
                    size="small"
                  >
                    Add Emoji
                  </Button>
                </Box>
                
                <TextField
                  fullWidth
                  label="Emoji Index Position"
                  type="number"
                  value={emojiIndex}
                  onChange={(e) => setEmojiIndex(parseInt(e.target.value) || 0)}
                  helperText="Position in text where emoji should appear (0-based index)"
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  label="Emojis (JSON array)"
                  multiline
                  rows={2}
                  value={JSON.stringify(formData.content?.emojis || [], null, 2)}
                  onChange={(e) => {
                    try {
                      const emojis = JSON.parse(e.target.value);
                      setFormData(prev => ({ 
                        ...prev, 
                        content: { ...prev.content, emojis }
                      }));
                    } catch (error) {
                      // Allow invalid JSON while typing
                    }
                  }}
                  helperText="Emoji data in LINE format (auto-filled when using visual selector)"
                />
              </Box>
            )}

            {formData.message_type === 'image' && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="subtitle1">Image Media</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Image />}
                    onClick={() => handleMediaUploadManagerOpen('image')}
                    size="small"
                  >
                    Select from Library
                  </Button>
                  {formData.content?.url && (
                    <Button
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => window.open(formData.content.url, '_blank')}
                      size="small"
                    >
                      View Image
                    </Button>
                  )}
                </Box>

                {selectedMedia && selectedMedia.file_type === 'image' && (
                  <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <img 
                        src={selectedMedia.url} 
                        alt={selectedMedia.original_name}
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {selectedMedia.original_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(selectedMedia.file_size / 1024)}KB
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                )}

                <TextField
                  fullWidth
                  label="Image URL"
                  value={formData.content?.url || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    content: { ...prev.content, url: e.target.value }
                  }))}
                  helperText="Enter the URL of the image to send (or use the media library above)"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Preview URL (optional)"
                  value={formData.content?.preview_url || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    content: { ...prev.content, preview_url: e.target.value }
                  }))}
                  helperText="Optional: Enter a preview image URL"
                />
              </Box>
            )}

            {formData.message_type === 'video' && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="subtitle1">Video Media</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<VideoLibrary />}
                    onClick={() => handleMediaUploadManagerOpen('video')}
                    size="small"
                  >
                    Select from Library
                  </Button>
                  {formData.content?.url && (
                    <Button
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => window.open(formData.content.url, '_blank')}
                      size="small"
                    >
                      View Video
                    </Button>
                  )}
                </Box>

                {selectedMedia && selectedMedia.file_type === 'video' && (
                  <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {selectedMedia.preview_url ? (
                        <img 
                          src={selectedMedia.preview_url} 
                          alt="Video preview"
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      ) : (
                        <Box 
                          sx={{ 
                            width: '80px', 
                            height: '80px', 
                            backgroundColor: '#f0f0f0',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <VideoLibrary />
                        </Box>
                      )}
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {selectedMedia.original_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(selectedMedia.file_size / 1024)}KB
                        </Typography>
                        {selectedMedia.conversion_success && (
                          <Chip label="Converted" size="small" color="success" sx={{ mt: 0.5 }} />
                        )}
                      </Box>
                    </Box>
                  </Card>
                )}

                <TextField
                  fullWidth
                  label="Video URL"
                  value={formData.content?.url || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    content: { ...prev.content, url: e.target.value }
                  }))}
                  helperText="Enter the URL of the video to send (or use the media library above)"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Preview URL (optional)"
                  value={formData.content?.preview_url || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    content: { ...prev.content, preview_url: e.target.value }
                  }))}
                  helperText="Optional: Enter a preview image URL"
                />
              </Box>
            )}

            {formData.message_type === 'audio' && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="subtitle1">Audio Media</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<VolumeUp />}
                    onClick={() => handleAudioUploadManagerOpen()}
                    size="small"
                  >
                    Select from Library
                  </Button>
                  {formData.content?.url && (
                    <Button
                      variant="outlined"
                      startIcon={<PlayArrow />}
                      onClick={() => handlePlayAudioInForm(formData.content.url)}
                      size="small"
                    >
                      Play Audio
                    </Button>
                  )}
                </Box>

                {selectedAudio && (
                  <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box 
                        sx={{ 
                          width: '80px', 
                          height: '80px', 
                          backgroundColor: '#f0f0f0',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <VolumeUp />
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {selectedAudio.original_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(selectedAudio.file_size / 1024)}KB
                        </Typography>
                        {selectedAudio.ios_compatible && (
                          <Chip label="iOS Compatible" size="small" color="success" sx={{ mt: 0.5 }} />
                        )}
                      </Box>
                    </Box>
                  </Card>
                )}

                <TextField
                  fullWidth
                  label="Audio URL"
                  value={formData.content?.url || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    content: { ...prev.content, url: e.target.value }
                  }))}
                  helperText="Enter the URL of the audio to send (or use the audio library above)"
                  sx={{ mb: 2 }}
                />
                
                {formData.content?.url && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Audio Preview
                    </Typography>
                    <audio 
                      controls 
                      style={{ width: '100%' }}
                      src={formData.content.url}
                      onError={(e) => console.error('Audio playback error:', e)}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </Box>
                )}
                <TextField
                  fullWidth
                  label="Duration (seconds)"
                  type="number"
                  value={formData.content?.duration || 0}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    content: { ...prev.content, duration: parseInt(e.target.value) || 0 }
                  }))}
                  helperText="Duration of the audio in seconds (for LINE Bot compatibility)"
                  inputProps={{ min: 0, max: 600 }}
                />
              </Box>
            )}

            {formData.message_type === 'imagemap' && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="subtitle1">Imagemap Message</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Crop />}
                    onClick={() => handleImagemapEditorOpen()}
                    size="small"
                  >
                    Edit Imagemap
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    onClick={() => handleImagemapImageUpload()}
                    size="small"
                  >
                    Upload Image
                  </Button>
                  {formData.content?.base_url && (
                    <Button
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => window.open(formData.content.base_url, '_blank')}
                      size="small"
                    >
                      View Image
                    </Button>
                  )}
                </Box>

                {formData.content?.base_url && (
                  <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <img 
                        src={formData.content.base_url}
                        alt="Imagemap base"
                        style={{ 
                          width: '120px', 
                          height: '120px', 
                          objectFit: 'cover',
                          borderRadius: '4px'
                        }}
                      />
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          Imagemap Message
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formData.content.base_size?.width} × {formData.content.base_size?.height}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {formData.content.actions?.length || 0} action areas
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                )}

                <TextField
                  fullWidth
                  label="Base Image URL"
                  value={formData.content?.base_url || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    content: { ...prev.content, base_url: e.target.value }
                  }))}
                  helperText="Enter the URL of the base image for the imagemap"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Alt Text"
                  value={formData.content?.alt_text || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    content: { ...prev.content, alt_text: e.target.value }
                  }))}
                  helperText="Alternative text for accessibility"
                />
              </Box>
            )}

            {formData.message_type === 'template' && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="subtitle1">Template Message</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<ViewModule />}
                    onClick={() => handleTemplateEditorOpen()}
                    size="small"
                  >
                    Edit Template
                  </Button>
                </Box>

                {formData.content?.template_type && (
                  <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <ViewModule sx={{ fontSize: 40, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {formData.content.template_type.charAt(0).toUpperCase() + formData.content.template_type.slice(1)} Template
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Alt Text: {formData.content.alt_text || 'Not set'}
                        </Typography>
                        {formData.content.template_data?.actions && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {formData.content.template_data.actions.length} actions
                          </Typography>
                        )}
                        {formData.content.template_data?.columns && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {(formData.content.template_data.columns as any[]).length} columns
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Card>
                )}

                <TextField
                  fullWidth
                  label="Alt Text"
                  value={formData.content?.alt_text || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    content: { ...prev.content, alt_text: e.target.value }
                  }))}
                  helperText="Alternative text for accessibility"
                />
              </Box>
            )}

            {formData.message_type === 'sticker' && (
              <Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Selected Sticker
                  </Typography>
                  {formData.content?.packageId && formData.content?.stickerId ? (
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <img 
                          src={getLineStickerUrl(formData.content.stickerId)}
                          alt="Selected Sticker"
                          style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) {
                              fallback.style.display = 'flex';
                              fallback.style.backgroundColor = getStickerColor(formData.content.stickerId);
                            }
                          }}
                        />
                        <Box 
                          sx={{ 
                            width: 60, 
                            height: 60, 
                            display: 'none',
                            backgroundColor: getStickerColor(formData.content.stickerId),
                            borderRadius: '8px',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.8rem'
                          }}
                        >
                          {formData.content.stickerId}
                        </Box>
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            Package: {formData.content.packageId}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Sticker: {formData.content.stickerId}
                          </Typography>
                        </Box>
                        <IconButton 
                          onClick={() => setFormData(prev => ({ 
                            ...prev, 
                            content: { type: 'sticker', packageId: '', stickerId: '' }
                          }))}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Card>
                  ) : (
                    <Alert severity="info">
                      No sticker selected. Click "Select Sticker" to choose one.
                    </Alert>
                  )}
                </Box>
                
                <Button
                  variant="outlined"
                  startIcon={<EmojiEmotions />}
                  onClick={() => setShowStickerSelector(true)}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Select Sticker
                </Button>

                <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="body2" color="info.contrastText">
                    <strong>ℹ️ LINE Sticker Selector:</strong> Choose from official LINE sticker packages.
                    <br />• Browse popular LINE sticker collections
                    <br />• Visual sticker preview with fallback
                    <br />• Automatic JSON generation for LINE API
                  </Typography>
                </Box>
              </Box>
            )}

            {formData.message_type === 'location' && canPerform('manage_location_messages') && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="subtitle1">Location Details</Typography>
                  {canPerform('manage_location_messages') && (
                    <Button
                      variant="outlined"
                      startIcon={<LocationOn />}
                      onClick={handleLocationSelectorOpen}
                      size="small"
                    >
                      Select from Map
                    </Button>
                  )}
                  {formData.content?.latitude && formData.content?.longitude && (
                    <Button
                      variant="outlined"
                      startIcon={<Map />}
                      onClick={() => {
                        const url = `https://www.google.com/maps?q=${formData.content.latitude},${formData.content.longitude}`;
                        window.open(url, '_blank');
                      }}
                      size="small"
                    >
                      View on Map
                    </Button>
                  )}
                </Box>

                {selectedLocation && (
                  <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <LocationOn color="primary" />
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {selectedLocation.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {selectedLocation.address}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                )}

                <TextField
                  fullWidth
                  label="Title"
                  value={formData.content?.title || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    content: { ...prev.content, title: e.target.value }
                  }))}
                  helperText="Enter the location title (or use the map selector above)"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Address"
                  value={formData.content?.address || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    content: { ...prev.content, address: e.target.value }
                  }))}
                  helperText="Enter the location address (or use the map selector above)"
                  sx={{ mb: 2 }}
                />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Latitude"
                      type="number"
                      value={formData.content?.latitude || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        content: { ...prev.content, latitude: e.target.value }
                      }))}
                      helperText="Enter latitude coordinate (or use the map selector above)"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Longitude"
                      type="number"
                      value={formData.content?.longitude || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        content: { ...prev.content, longitude: e.target.value }
                      }))}
                      helperText="Enter longitude coordinate (or use the map selector above)"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {formData.message_type === 'flex' && (
              <Box>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Select Flex Message</InputLabel>
                  <Select
                    value={selectedFlexMessageId}
                    onChange={(e) => handleFlexMessageSelect(e.target.value)}
                    label="Select Flex Message"
                    disabled={flexMessageLoading}
                  >
                    <MenuItem value="">
                      <em>Choose from existing Flex Messages</em>
                    </MenuItem>
                    {(editingKeyword ? botReplyFlexMessages : getAvailableFlexMessages()).map((msg) => (
                      <MenuItem key={msg.id} value={msg.id}>
                        {msg.name} - {msg.description}
                        {!editingKeyword && (
                          <Chip 
                            label="Available" 
                            color="success" 
                            size="small" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Button
                  variant="outlined"
                  onClick={handleFlexMessageSelectorOpen}
                  startIcon={<FolderOpen />}
                  sx={{ mt: 1, mb: 2 }}
                  disabled={flexMessageLoading}
                >
                  Browse Flex Messages
                </Button>
                
                <TextField
                  fullWidth
                  label="Flex Message JSON"
                  multiline
                  rows={6}
                  value={JSON.stringify(formData.content, null, 2)}
                  onChange={(e) => {
                    try {
                      const content = JSON.parse(e.target.value);
                      setFormData(prev => ({ ...prev, content }));
                    } catch (error) {
                      // Allow invalid JSON while typing
                    }
                  }}
                  helperText="Flex Message JSON (auto-filled when selecting from list)"
                />
              </Box>
            )}
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    is_active: e.target.checked 
                  }))}
                />
              }
              label="Active"
            />
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderJsonEditor = () => {
    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Keywords (comma-separated)"
              value={formData.keywords.join(', ')}
              onChange={(e) => handleKeywordsChange(e.target.value)}
              helperText="Enter keywords separated by commas"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Priority"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                priority: parseInt(e.target.value) || 0 
              }))}
              helperText="Higher priority keywords are checked first"
              inputProps={{ min: 0, max: 10 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    is_active: e.target.checked 
                  }))}
                />
              }
              label="Active"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Complete Keyword Reply JSON"
              multiline
              rows={12}
              value={JSON.stringify(formData, null, 2)}
              onChange={(e) => {
                try {
                  const parsedData = JSON.parse(e.target.value);
                  setFormData(parsedData);
                } catch (error) {
                  // Allow invalid JSON while typing
                }
              }}
              helperText="Enter the complete keyword reply JSON structure"
            />
          </Grid>
        </Grid>
      </Box>
    );
  };

  if (loading && keywords.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, md: 4 }, 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
    }}>
      {/* Header Section */}
      <Box sx={{ 
        mb: 4, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 3,
        background: 'white',
        p: 3,
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          flex: 1
        }}>
          <Box sx={{ 
            bgcolor: 'primary.main', 
            width: 56, 
            height: 56,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)'
          }}>
            <Message sx={{ fontSize: 28, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              mb: 1,
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Keyword Reply Manager
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
              Manage automated responses based on user keywords
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newViewMode) => {
              if (newViewMode !== null) {
                setViewMode(newViewMode);
              }
            }}
            size="small"
          >
            <ToggleButton value="table" aria-label="table view">
              <TableChart />
            </ToggleButton>
            <ToggleButton value="cards" aria-label="card view">
              <ViewModule />
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Keyword Reply
          </Button>
        </Box>
      </Box>

      {/* Filter Section */}
      <Box sx={{ 
        mb: 3,
        background: 'white',
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <Box 
          sx={{ 
            p: 3, 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.02)'
            }
          }}
          onClick={() => setFilterSectionExpanded(!filterSectionExpanded)}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
            Filters & Search
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {(searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterPriority !== 'all') && (
              <Chip 
                label="Active" 
                color="primary" 
                size="small"
                variant="outlined"
              />
            )}
            {filterSectionExpanded ? <ExpandLess /> : <ExpandMore />}
          </Box>
        </Box>
        
        {filterSectionExpanded && (
          <Box sx={{ px: 3, pb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search keywords, type, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Message Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Message Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="text">Text</MenuItem>
                <MenuItem value="text_v2">Text V2</MenuItem>
                <MenuItem value="flex">Flex</MenuItem>
                <MenuItem value="image">Image</MenuItem>
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="audio">Audio</MenuItem>
                <MenuItem value="sticker">Sticker</MenuItem>
                <MenuItem value="location">Location</MenuItem>
                <MenuItem value="imagemap">Imagemap</MenuItem>
                <MenuItem value="template">Template</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                label="Priority"
              >
                <MenuItem value="all">All Priorities</MenuItem>
                <MenuItem value="high">High (8-10)</MenuItem>
                <MenuItem value="medium">Medium (4-7)</MenuItem>
                <MenuItem value="low">Low (0-3)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip 
                label={`${filteredKeywords.length} of ${keywords.length}`} 
                color="primary" 
                variant="outlined"
                size="small"
              />
              {(searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterPriority !== 'all') && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                    setFilterStatus('all');
                    setFilterPriority('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
        
        {/* Sort Controls */}
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="updated_at">Last Updated</MenuItem>
                  <MenuItem value="created_at">Created Date</MenuItem>
                  <MenuItem value="priority">Priority</MenuItem>
                  <MenuItem value="keywords">Keywords</MenuItem>
                  <MenuItem value="message_type">Message Type</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Order</InputLabel>
                <Select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  label="Order"
                >
                  <MenuItem value="desc">Newest First</MenuItem>
                  <MenuItem value="asc">Oldest First</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={7}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Currently sorted by: <strong>{sortBy === 'updated_at' ? 'Last Updated' : 
                    sortBy === 'created_at' ? 'Created Date' : 
                    sortBy === 'priority' ? 'Priority' : 
                    sortBy === 'keywords' ? 'Keywords' : 'Message Type'}</strong> 
                  ({sortOrder === 'desc' ? 'Newest First' : 'Oldest First'})
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
          </Box>
        )}
      </Box>

      {viewMode === 'table' ? (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Keywords</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Content</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredKeywords.map((keyword) => (
                <TableRow key={keyword.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getMessageTypeIcon(keyword.message_type)}
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {keyword.keywords.join(', ')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={keyword.message_type.toUpperCase()}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }}>
                      {keyword.message_type === 'text' && keyword.content?.text}
                      {keyword.message_type === 'text_v2' && keyword.content?.text}
                      {keyword.message_type === 'image' && `Image: ${keyword.content?.url || 'No URL'}`}
                      {keyword.message_type === 'video' && `Video: ${keyword.content?.url || 'No URL'}`}
                      {keyword.message_type === 'audio' && `Audio: ${keyword.content?.url || 'No URL'}`}
                      {keyword.message_type === 'imagemap' && `Imagemap: ${keyword.content?.base_url || 'No URL'} (${keyword.content?.actions?.length || 0} actions)`}
                      {keyword.message_type === 'template' && `${keyword.content?.template_type || 'Unknown'} Template: ${keyword.content?.alt_text || 'No Alt Text'}`}
                      {keyword.message_type === 'flex' && getFlexMessageName(keyword.content)}
                      {keyword.message_type === 'sticker' && `Sticker: ${keyword.content?.package_id || 'No Package ID'}`}
                      {keyword.message_type === 'location' && canPerform('view_location_history') && `Location: ${keyword.content?.title || 'No Title'}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`Priority: ${keyword.priority}`}
                      color={getPriorityColor(keyword.priority)}
                      size="small"
                      icon={<PriorityHigh />}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={keyword.is_active ? 'Active' : 'Inactive'}
                      color={keyword.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {keyword.created_at ? formatDate(keyword.created_at, { includeTime: true }) : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {keyword.updated_at ? formatDate(keyword.updated_at, { includeTime: true }) : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(keyword)}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(keyword.id!)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Grid container spacing={3}>
          {filteredKeywords.map((keyword) => (
            <Grid item xs={12} md={6} key={keyword.id}>
              <Card sx={{ 
                background: 'white',
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  transform: 'translateY(-2px)'
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getMessageTypeIcon(keyword.message_type)}
                      <Typography variant="h6">
                        {keyword.keywords.join(', ')}
                      </Typography>
                    </Box>
                    <Chip
                      label={`Priority: ${keyword.priority}`}
                      color={getPriorityColor(keyword.priority)}
                      size="small"
                      icon={<PriorityHigh />}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {keyword.message_type === 'text' && keyword.content?.text}
                    {keyword.message_type === 'text_v2' && keyword.content?.text}
                    {keyword.message_type === 'image' && `Image: ${keyword.content?.url || 'No URL'}`}
                    {keyword.message_type === 'video' && `Video: ${keyword.content?.url || 'No URL'}`}
                    {keyword.message_type === 'audio' && `Audio: ${keyword.content?.url || 'No URL'}`}
                    {keyword.message_type === 'imagemap' && `Imagemap: ${keyword.content?.base_url || 'No URL'} (${keyword.content?.actions?.length || 0} actions)`}
                    {keyword.message_type === 'template' && `${keyword.content?.template_type || 'Unknown'} Template: ${keyword.content?.alt_text || 'No Alt Text'}`}
                    {keyword.message_type === 'flex' && getFlexMessageName(keyword.content)}
                    {keyword.message_type === 'sticker' && `Sticker: ${keyword.content?.package_id || 'No Package ID'}`}
                    {keyword.message_type === 'location' && canPerform('view_location_history') && `Location: ${keyword.content?.title || 'No Title'}`}
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Created: {keyword.created_at ? formatDate(keyword.created_at, { includeTime: true }) : 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Updated: {keyword.updated_at ? formatDate(keyword.updated_at, { includeTime: true }) : 'N/A'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={keyword.is_active}
                          disabled
                          size="small"
                        />
                      }
                      label={keyword.is_active ? 'Active' : 'Inactive'}
                    />
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(keyword)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(keyword.id!)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {editingKeyword ? 'Edit Keyword Reply' : 'Create New Keyword Reply'}
            </Typography>
            <Chip 
              label="Visual Template System" 
              color="primary" 
              size="small"
              icon={<Palette />}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs 
              value={templateTabValue} 
              onChange={handleTemplateTabChange}
              aria-label="keyword reply creation tabs"
            >
              <Tab 
                label="Visual Template" 
                icon={<Palette />} 
                iconPosition="start"
                id="keyword-tab-0"
              />
              <Tab 
                label="JSON Editor" 
                icon={<Code />} 
                iconPosition="start"
                id="keyword-tab-1"
              />
            </Tabs>
          </Box>

          <TabPanel value={templateTabValue} index={0}>
            {renderVisualTemplate()}
          </TabPanel>
          
          <TabPanel value={templateTabValue} index={1}>
            {renderJsonEditor()}
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading || !formData.keywords.length}
          >
            {loading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Flex Message Selector Dialog */}
      <Dialog open={showFlexMessageSelector} onClose={handleFlexMessageSelectorClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ViewModule />
            Select Flex Message
          </Box>
        </DialogTitle>
        <DialogContent>
          {flexMessageLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (editingKeyword ? botReplyFlexMessages : getAvailableFlexMessages()).length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="body1" color="text.secondary">
                {editingKeyword ? 
                  'No Flex Messages found with "BOT Reply" purpose.' :
                  'No available Flex Messages found. All Flex Messages are already in use.'
                }
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {editingKeyword ?
                  'Create Flex Messages in the System Flex Messages section first.' :
                  'Create new Flex Messages in the System Flex Messages section or edit existing keyword replies to free up Flex Messages.'
                }
              </Typography>
            </Box>
          ) : (
            <List>
              {(editingKeyword ? botReplyFlexMessages : getAvailableFlexMessages()).map((msg, index) => (
                <React.Fragment key={msg.id}>
                  <ListItem disablePadding>
                    <ListItemButton onClick={() => handleFlexMessageFromSelector(msg)}>
                      <ListItemText
                        primary={msg.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {msg.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Chip 
                                label="BOT Reply" 
                                color="primary" 
                                size="small" 
                              />
                              {!editingKeyword && (
                                <Chip 
                                  label="Available" 
                                  color="success" 
                                  size="small" 
                                />
                              )}
                              {!msg.is_active && (
                                <Chip 
                                  label="Inactive" 
                                  color="error" 
                                  size="small" 
                                />
                              )}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < (editingKeyword ? botReplyFlexMessages : getAvailableFlexMessages()).length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFlexMessageSelectorClose}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Media Upload Manager Dialog */}
      {showMediaUploadManager && (
        <Dialog
          open={showMediaUploadManager}
          onClose={() => setShowMediaUploadManager(false)}
          maxWidth="xl"
          fullWidth
          PaperProps={{
            sx: {
              maxHeight: '90vh',
              minHeight: '70vh'
            }
          }}
        >
          <DialogTitle>
            {mediaUploadType === 'image' ? 'Image' : 'Video'} Media Library
          </DialogTitle>
          <DialogContent sx={{ overflow: 'auto' }}>
            <MediaUploadManager
              onMediaSelect={handleMediaSelect}
              selectedMedia={selectedMedia}
              fileType={mediaUploadType}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Audio Upload Manager Dialog */}
      {showAudioUploadManager && (
        <Dialog
          open={showAudioUploadManager}
          onClose={() => setShowAudioUploadManager(false)}
          maxWidth="xl"
          fullWidth
          PaperProps={{
            sx: {
              maxHeight: '90vh',
              minHeight: '70vh'
            }
          }}
        >
          <DialogTitle>
            Audio Media Library
          </DialogTitle>
          <DialogContent sx={{ overflow: 'auto' }}>
            <AudioUploadManager
              onAudioSelect={handleAudioSelect}
              selectedAudio={selectedAudio}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Location Selector Dialog */}
      {showLocationSelector && canPerform('manage_location_messages') && (
        <LocationSelector
          onLocationSelect={handleLocationSelect}
          selectedLocation={selectedLocation}
          onClose={() => setShowLocationSelector(false)}
        />
      )}

      {/* Imagemap Editor Dialog */}
      {showImagemapEditor && (
        <Dialog
          open={showImagemapEditor}
          onClose={() => setShowImagemapEditor(false)}
          maxWidth="xl"
          fullWidth
          PaperProps={{
            sx: {
              maxHeight: '95vh',
              minHeight: '80vh'
            }
          }}
        >
          <DialogTitle>
            Imagemap Message Editor
          </DialogTitle>
          <DialogContent sx={{ overflow: 'auto' }}>
            <ImagemapEditor
              imagemap={{
                baseUrl: formData.content?.base_url || '',
                altText: formData.content?.alt_text || '',
                baseSize: formData.content?.base_size || { width: 1040, height: 1040 },
                actions: formData.content?.actions || []
              }}
              onSave={handleImagemapSave}
              onCancel={() => setShowImagemapEditor(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Template Message Editor Dialog */}
      {showTemplateEditor && (
        <Dialog
          open={showTemplateEditor}
          onClose={() => setShowTemplateEditor(false)}
          maxWidth="xl"
          fullWidth
          PaperProps={{
            sx: {
              maxHeight: '95vh',
              minHeight: '80vh'
            }
          }}
        >
          <DialogTitle>
            Template Message Editor
          </DialogTitle>
          <DialogContent sx={{ overflow: 'auto' }}>
            <TemplateMessageEditor
              template={{
                templateType: formData.content?.template_type || 'buttons',
                altText: formData.content?.alt_text || '',
                templateData: formData.content?.template_data || {}
              }}
              onSave={handleTemplateSave}
              onCancel={() => setShowTemplateEditor(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Emoji Selector Dialog */}
      <Dialog open={showEmojiSelector} onClose={handleEmojiSelectorClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiIcon />
            Select LINE Emoji
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Select a LINE emoji package and specific emoji. Images are loaded directly from LINE's CDN.
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {LINE_EMOJI_PACKAGES.map((pkg) => (
              <Grid item xs={12} key={pkg.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      {pkg.name} ({pkg.emojis.length} emojis)
                    </Typography>
                    <Grid container spacing={1}>
                      {pkg.emojis.slice(0, 20).map((emoji) => (
                        <Grid item key={emoji.id}>
                          <Card 
                            variant="outlined" 
                            sx={{ 
                              cursor: 'pointer',
                              width: 60,
                              height: 60,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              '&:hover': { 
                                backgroundColor: 'action.hover',
                                borderColor: 'primary.main'
                              }
                            }}
                            onClick={() => handleAddEmoji(pkg.id, emoji.id)}
                          >
                                                         <Box sx={{ textAlign: 'center' }}>
                               <img 
                                 src={getLineEmojiUrl(pkg.id, emoji.id)}
                                 alt={emoji.name}
                                 style={{ 
                                   width: '40px', 
                                   height: '40px',
                                   objectFit: 'contain'
                                 }}
                                 onError={(e) => {
                                   // Fallback to colored placeholder if image fails to load
                                   const target = e.target as HTMLImageElement;
                                   target.style.display = 'none';
                                   const fallback = target.nextElementSibling as HTMLElement;
                                   if (fallback) {
                                     fallback.style.display = 'flex';
                                     fallback.style.backgroundColor = getEmojiColor(emoji.id);
                                   }
                                 }}
                               />
                               <Box 
                                 sx={{ 
                                   width: 40, 
                                   height: 40, 
                                   display: 'none',
                                   backgroundColor: getEmojiColor(emoji.id),
                                   borderRadius: '50%',
                                   alignItems: 'center',
                                   justifyContent: 'center',
                                   color: 'white',
                                   fontWeight: 'bold',
                                   fontSize: '1.2rem',
                                   margin: '0 auto'
                                 }}
                               >
                                 {emoji.id}
                               </Box>
                               <Typography variant="caption" display="block" sx={{ fontSize: '0.6rem', mt: 0.5 }}>
                                 {emoji.id}
                               </Typography>
                             </Box>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                    {pkg.emojis.length > 20 && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                        Showing first 20 emojis. More available in this package.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ mt: 3, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
            <Typography variant="body2" color="success.contrastText">
              <strong>✅ Official LINE Emoji Selector:</strong> This emoji selector includes:
              <br />• Official LINE emoji packages from LINE Developers documentation
              <br />• Actual LINE emoji images loaded from official CDN
              <br />• Smart fallback system with colored placeholders
              <br />• Complete list of emoji IDs for each package (200+ emojis)
              <br />• Automatic JSON generation for LINE API
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEmojiSelectorClose}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sticker Selector Dialog */}
      <Dialog 
        open={showStickerSelector} 
        onClose={handleStickerSelectorClose} 
        maxWidth="xl" 
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            minHeight: '70vh'
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEmotions />
            Select LINE Sticker
          </Box>
        </DialogTitle>
        <DialogContent sx={{ overflow: 'auto' }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Select a LINE sticker package and specific sticker. Images are loaded directly from LINE's CDN.
            </Typography>
            <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
              Showing {LINE_STICKER_PACKAGES.length} packages with {LINE_STICKER_PACKAGES.reduce((total, pkg) => total + pkg.stickers.length, 0)} total stickers
              {stickerSearchTerm && (
                <span> (Filtered: {LINE_STICKER_PACKAGES.filter(pkg => 
                  pkg.name.toLowerCase().includes(stickerSearchTerm.toLowerCase()) ||
                  pkg.stickers.some(sticker => 
                    sticker.id.includes(stickerSearchTerm) ||
                    sticker.name.toLowerCase().includes(stickerSearchTerm.toLowerCase())
                  )
                ).length} packages)</span>
              )}
            </Typography>
            
            {/* Search Box */}
            <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center' }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search stickers by package name or sticker ID..."
                value={stickerSearchTerm}
                onChange={(e) => setStickerSearchTerm(e.target.value)}
                size="small"
              />
              {stickerSearchTerm && (
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => setStickerSearchTerm('')}
                >
                  Show All
                </Button>
              )}
            </Box>
          </Box>
          
          <Grid container spacing={3}>
            {LINE_STICKER_PACKAGES
              .filter(pkg => 
                stickerSearchTerm === '' || 
                pkg.name.toLowerCase().includes(stickerSearchTerm.toLowerCase()) ||
                pkg.stickers.some(sticker => 
                  sticker.id.includes(stickerSearchTerm) ||
                  sticker.name.toLowerCase().includes(stickerSearchTerm.toLowerCase())
                )
              )
              .map((pkg) => (
              <Grid item xs={12} key={pkg.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      {pkg.name} ({pkg.stickers.length} stickers)
                    </Typography>
                    <Grid container spacing={1}>
                      {pkg.stickers.map((sticker) => (
                        <Grid item key={sticker.id}>
                          <Card 
                            variant="outlined" 
                            sx={{ 
                              cursor: 'pointer',
                              width: 80,
                              height: 80,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              '&:hover': { 
                                backgroundColor: 'action.hover',
                                borderColor: 'primary.main'
                              }
                            }}
                            onClick={() => handleAddSticker(pkg.id, sticker.id)}
                          >
                            <Box sx={{ textAlign: 'center' }}>
                              <img 
                                src={getLineStickerUrl(sticker.id)}
                                alt={sticker.name}
                                style={{ 
                                  width: '60px', 
                                  height: '60px',
                                  objectFit: 'contain'
                                }}
                                onError={(e) => {
                                  // Fallback to colored placeholder if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) {
                                    fallback.style.display = 'flex';
                                    fallback.style.backgroundColor = getStickerColor(sticker.id);
                                  }
                                }}
                              />
                              <Box 
                                sx={{ 
                                  width: 60, 
                                  height: 60, 
                                  display: 'none',
                                  backgroundColor: getStickerColor(sticker.id),
                                  borderRadius: '8px',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: '0.8rem'
                                }}
                              >
                                {sticker.id}
                              </Box>
                              <Typography variant="caption" display="block" sx={{ fontSize: '0.6rem', mt: 0.5 }}>
                                {sticker.id}
                              </Typography>
                            </Box>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body2" color="info.contrastText">
              <strong>📋 Package List:</strong> Available packages:
              <br />{LINE_STICKER_PACKAGES.map((pkg, index) => 
                `${index + 1}. ${pkg.name} (${pkg.stickers.length} stickers)`
              ).join(', ')}
            </Typography>
          </Box>
          
          <Box sx={{ mt: 3, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
            <Typography variant="body2" color="success.contrastText">
              <strong>✅ Official LINE Sticker Selector:</strong> This sticker selector includes:
              <br />• Official LINE sticker packages from LINE Developers documentation
              <br />• Actual LINE sticker images loaded from official CDN
              <br />• Smart fallback system with colored placeholders
              <br />• Complete list of sticker IDs for each package
              <br />• Automatic JSON generation for LINE API
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStickerSelectorClose}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default KeywordReplyManager;
