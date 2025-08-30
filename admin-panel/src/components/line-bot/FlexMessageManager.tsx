import React, { useState, useEffect } from 'react';
import FileUploadDialog from './FileUploadDialog.tsx';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  FormControlLabel,
  Switch,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Smartphone as SmartphoneIcon,
  Code as CodeIcon,
  ViewModule as ViewModuleIcon,
  ViewCarousel as ViewCarouselIcon,
  TextFields as TextFieldsIcon,
  CropSquare as CropSquareIcon,
  Image as ImageIcon,
  VideoLibrary as VideoLibraryIcon,
  EmojiEmotions as EmojiEmotionsIcon,
  Remove as SeparatorIcon,
  Dashboard as DashboardIcon,
  ExpandMore as ExpandMoreIcon,
  Build as BuildIcon,
  Category as CategoryIcon,
  DragIndicator as DragIndicatorIcon,
  OpenInNew as OpenInNewIcon,
  TableChart as TableChartIcon
} from '@mui/icons-material';
import { getAllSystemFlexMessages, createNewSystemFlexMessage, updateSystemFlexMessageById, deleteSystemFlexMessageById, getFlexMessagesByPurpose } from '../../api';

interface FlexMessage {
  _id?: string;
  name: string;
  purpose: string;
  flex_message: any;
  alt_text: string;
  quick_reply?: any;
  tags: string[];
  created_at?: string;
  updated_at?: string;
  usertimestamp?: string;
}

const FlexMessageManager: React.FC = () => {
  const [flexMessages, setFlexMessages] = useState<FlexMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<FlexMessage | null>(null);
  const [previewMessage, setPreviewMessage] = useState<FlexMessage | null>(null);
  const [previewTabValue, setPreviewTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [designerOpen, setDesignerOpen] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<string>('');
  const [selectedComponents, setSelectedComponents] = useState<any[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [editingElement, setEditingElement] = useState<any>(null);
  const [showElementEditor, setShowElementEditor] = useState(false);
  const [fileUploadDialog, setFileUploadDialog] = useState<{
    open: boolean;
    fileType: 'image' | 'video';
    onSelect: (fileData: { url: string; previewUrl?: string; filename: string }) => void;
  }>({
    open: false,
    fileType: 'image',
    onSelect: () => {}
  });

  // View mode state
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Flex Message Templates based on LINE documentation
  const flexTemplates = {
    containers: [
      {
        id: 'bubble',
        name: 'Bubble Container',
        description: 'A container that displays a single message bubble',
        icon: <ViewModuleIcon />,
        template: {
          type: 'bubble',
          size: 'mega',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: []
          }
        }
      },
      {
        id: 'carousel',
        name: 'Carousel Container',
        description: 'A container that displays multiple message bubbles, laid out side by side',
        icon: <ViewCarouselIcon />,
        template: {
          type: 'carousel',
          contents: []
        }
      }
    ],
    blocks: [
      {
        id: 'header',
        name: 'Header Block',
        description: 'Block that displays the message subject or header',
        icon: <TextFieldsIcon />,
        template: {
          type: 'box',
          layout: 'vertical',
          contents: []
        }
      },
      {
        id: 'hero',
        name: 'Hero Block',
        description: 'Block that displays the main image',
        icon: <ImageIcon />,
        template: {
          type: 'image',
          url: 'https://example.com/hero-image.jpg',
          size: 'full',
          aspectRatio: '2:1'
        }
      },
      {
        id: 'body',
        name: 'Body Block',
        description: 'Block that displays the main message',
        icon: <CropSquareIcon />,
        template: {
          type: 'box',
          layout: 'vertical',
          contents: []
        }
      },
      {
        id: 'footer',
        name: 'Footer Block',
        description: 'Block that displays buttons and supplementary information',
        icon: <CropSquareIcon />,
        template: {
          type: 'box',
          layout: 'vertical',
          contents: []
        }
      }
    ],
    components: [
      {
        id: 'box',
        type: 'box',
        name: 'Box',
        description: 'Defines horizontal or vertical layout orientation and holds components together',
        icon: <CropSquareIcon />,
        category: 'layout',
        template: {
          type: 'box',
          layout: 'vertical',
          contents: []
        }
      },
      {
        id: 'text',
        type: 'text',
        name: 'Text',
        description: 'Renders a text string with customizable color, size, and weight',
        icon: <TextFieldsIcon />,
        category: 'content',
        template: {
          type: 'text',
          text: 'Sample text',
          size: 'md',
          weight: 'regular',
          color: '#000000',
          wrap: false,
          lineSpacing: '',
          maxLines: 0,
          flex: 0,
          margin: 'none',
          position: 'relative',
          offsetTop: '0px',
          offsetBottom: '0px',
          offsetStart: '0px',
          offsetEnd: '0px',
          align: 'start',
          gravity: 'top',
          adjustMode: 'shrink-to-fit',
          scaling: false,
          contents: []
        }
      },
      {
        id: 'span',
        type: 'span',
        name: 'Span',
        description: 'Renders multiple text strings in different styles',
        icon: <TextFieldsIcon />,
        category: 'content',
        template: {
          type: 'span',
          text: 'Sample span',
          color: '#000000',
          size: 'md',
          weight: 'regular'
        }
      },
      {
        id: 'button',
        type: 'button',
        name: 'Button',
        description: 'Renders a button with three styles: primary, secondary, and link',
        icon: <CropSquareIcon />,
        category: 'interactive',
        template: {
          type: 'button',
          action: {
            type: 'postback',
            label: 'Button',
            data: 'action=button'
          },
          style: 'primary',
          color: '#000000',
          flex: 0,
          margin: 'none',
          height: 'sm',
          gravity: 'top'
        }
      },
      {
        id: 'image',
        type: 'image',
        name: 'Image',
        description: 'Renders an image with customizable size and aspect ratio',
        icon: <ImageIcon />,
        category: 'media',
        template: {
          type: 'image',
          url: 'https://example.com/image.jpg',
          size: 'md',
          aspectRatio: '1:1'
        }
      },
      {
        id: 'video',
        type: 'video',
        name: 'Video',
        description: 'Renders a video with preview image (requires proper URL and preview)',
        icon: <VideoLibraryIcon />,
        category: 'media',
        template: {
          type: 'video',
          url: 'https://example.com/video.mp4',
          previewUrl: 'https://example.com/preview.jpg',
          altContent: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'Video not available',
                size: 'lg',
                weight: 'bold'
              }
            ]
          }
        }
      },
      {
        id: 'icon',
        type: 'icon',
        name: 'Icon',
        description: 'Renders an icon with customizable size',
        icon: <EmojiEmotionsIcon />,
        category: 'content',
        template: {
          type: 'icon',
          url: 'https://example.com/icon.png',
          size: 'md'
        }
      },
      {
        id: 'separator',
        type: 'separator',
        name: 'Separator',
        description: 'Renders a separating line inside a box',
        icon: <SeparatorIcon />,
        category: 'layout',
        template: {
          type: 'separator',
          margin: 'md'
        }
      },
      {
        id: 'filler',
        type: 'filler',
        name: 'Filler (Deprecated)',
        description: 'Renders an empty space (deprecated - use spacing properties instead)',
        icon: <CropSquareIcon />,
        category: 'layout',
        template: {
          type: 'filler',
          flex: 1
        }
      },
      {
        id: 'spacer',
        type: 'spacer',
        name: 'Spacer',
        description: 'Adds flexible space between components',
        icon: <CropSquareIcon />,
        category: 'layout',
        template: {
          type: 'spacer',
          size: 'md'
        }
      }
    ]
  };

  const [formData, setFormData] = useState({
    name: '',
    purpose: 'liff_message',
    flex_message: {} as any,
    alt_text: '',
    quick_reply: null,
    tags: [] as string[]
  });

  // Template selection state
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateLoading, setTemplateLoading] = useState(false);

  useEffect(() => {
    loadFlexMessages();
    loadAvailableTemplates();
  }, []);

  const loadAvailableTemplates = async () => {
    setTemplateLoading(true);
    try {
      const response = await getFlexMessagesByPurpose('bot_reply');
      console.log('🔍 API Response:', response.data);
      console.log('🔍 Total messages received:', response.data?.length || 0);
      
      // Filter to show only templates (messages with template_type or specific tags)
      const templates = (response.data || []).filter((message: any) => {
        // Show messages that have template_type or are marked as templates
        const isTemplate = message.template_type || 
               (message.tags && message.tags.includes('template')) ||
               message.name.includes('Template') ||
               message.name.includes('Full AutoPlay');
        
        console.log(`🔍 Message "${message.name}":`, {
          template_type: message.template_type,
          tags: message.tags,
          name_has_template: message.name.includes('Template'),
          name_has_full_autoplay: message.name.includes('Full AutoPlay'),
          isTemplate
        });
        
        return isTemplate;
      });
      
      console.log('🔍 Templates found:', templates.length);
      console.log('🔍 Template names:', templates.map((t: any) => t.name));
      
      setAvailableTemplates(templates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      purpose: template.purpose,
      flex_message: template.flex_message,
      alt_text: template.alt_text,
      quick_reply: template.quick_reply,
      tags: template.tags || []
    });
  };

  const loadFlexMessages = async () => {
      setLoading(true);
    try {
      const response = await getAllSystemFlexMessages();
      setFlexMessages(response.data || []);
    } catch (error) {
      console.error('Error loading flex messages:', error);
      setSnackbar({ open: true, message: 'Failed to load flex messages', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingMessage(null);
    setSelectedTemplate(null);
    setFormData({
      name: '',
      purpose: 'liff_message',
      flex_message: {},
      alt_text: '',
      quick_reply: null,
      tags: []
    });
    setDialogOpen(true);
  };

  const handleEdit = (message: FlexMessage) => {
      setEditingMessage(message);
      setSelectedTemplate(null); // Clear template selection when editing
      setFormData({
        name: message.name,
      purpose: message.purpose,
      flex_message: message.flex_message,
      alt_text: message.alt_text,
      quick_reply: message.quick_reply,
      tags: message.tags
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this flex message?')) {
      try {
        await deleteSystemFlexMessageById(id);
        setSnackbar({ open: true, message: 'Flex message deleted successfully', severity: 'success' });
        loadFlexMessages();
      } catch (error) {
        console.error('Error deleting flex message:', error);
        setSnackbar({ open: true, message: 'Failed to delete flex message', severity: 'error' });
      }
    }
  };

  const handleSave = async () => {
    try {
      if (editingMessage) {
        await updateSystemFlexMessageById(editingMessage._id!, formData);
        setSnackbar({ open: true, message: 'Flex message updated successfully', severity: 'success' });
    } else {
        await createNewSystemFlexMessage(formData);
        setSnackbar({ open: true, message: 'Flex message created successfully', severity: 'success' });
      }
      setDialogOpen(false);
      loadFlexMessages();
    } catch (error) {
      console.error('Error saving flex message:', error);
      setSnackbar({ open: true, message: 'Failed to save flex message', severity: 'error' });
    }
  };

  const handlePreview = (message: FlexMessage) => {
    setPreviewMessage(message);
    setPreviewDialogOpen(true);
    setPreviewTabValue(0);
  };

  const handleOpenDesigner = () => {
    setDesignerOpen(true);
    
    // Initialize designer with existing flex message data
    if (formData.flex_message && Object.keys(formData.flex_message).length > 0) {
      // Set selected container based on existing flex message type
      if (formData.flex_message.type === 'bubble') {
        setSelectedContainer('bubble');
      } else if (formData.flex_message.type === 'carousel') {
        setSelectedContainer('carousel');
      }
      
      // Ensure all elements have unique IDs
      const updatedFlexMessage = { ...formData.flex_message };
      assignUniqueIdsToStructure(updatedFlexMessage);
      
      // Update formData with the structure that has unique IDs
      setFormData({
        ...formData,
        flex_message: updatedFlexMessage
      });
      
      // Extract and set selected components from existing structure
      const allComponents = extractAllComponents(updatedFlexMessage);
      setSelectedComponents(allComponents);
    } else {
      // For new flex messages, reset to default state
      setSelectedContainer('');
      setSelectedComponents([]);
    }
  };

  const assignUniqueIdsToStructure = (structure: any) => {
    if (!structure) return;
    
    // Add unique ID to this element if it doesn't have one
    if (!structure.id && structure.type && structure.type !== 'bubble' && structure.type !== 'carousel') {
      structure.id = `${structure.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Recursively process contents
    if (structure.contents && Array.isArray(structure.contents)) {
      for (const item of structure.contents) {
        assignUniqueIdsToStructure(item);
      }
    }
    
    // Recursively process body contents
    if (structure.body && structure.body.contents && Array.isArray(structure.body.contents)) {
      for (const item of structure.body.contents) {
        assignUniqueIdsToStructure(item);
      }
    }
    
    // Recursively process blocks (header, hero, body, footer)
    const blocks = ['header', 'hero', 'body', 'footer'];
    for (const block of blocks) {
      if (structure[block]) {
        assignUniqueIdsToStructure(structure[block]);
      }
    }
  };

  const handleCloseDesigner = () => {
    setDesignerOpen(false);
  };

  const handleSaveDesign = () => {
    // Update the form data with the designed flex message
    setFormData({
      ...formData,
      flex_message: formData.flex_message
    });
    
    // Close the designer
    setDesignerOpen(false);
    
    // Show success message
    setSnackbar({
      open: true,
      message: 'Flex Message design saved successfully!',
      severity: 'success'
    });
  };

  const handleSelectContainer = (containerId: string) => {
    const container = flexTemplates.containers.find(c => c.id === containerId);
    if (container) {
      setSelectedContainer(containerId);
      
      // Only reset if we're changing container type or if no existing data
      const currentType = formData.flex_message?.type;
      if (currentType !== containerId || !formData.flex_message || Object.keys(formData.flex_message).length === 0) {
        setSelectedComponents([]); // Reset selected components when changing container
        setFormData({
          ...formData,
          flex_message: container.template
        });
      }
    }
  };

  const handleAddComponent = (componentId: string) => {
    const component = flexTemplates.components.find(c => c.id === componentId);
    if (component) {
      const newComponent = {
        ...component.template,
        id: `${componentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      console.log('Adding component:', newComponent);
      
      // Add to flex message structure
      const updatedFlexMessage = { ...formData.flex_message };
      if (updatedFlexMessage.type === 'bubble' && updatedFlexMessage.body) {
        if (!updatedFlexMessage.body.contents) {
          updatedFlexMessage.body.contents = [];
        }
        updatedFlexMessage.body.contents.push(newComponent);
      } else if (updatedFlexMessage.type === 'carousel') {
        if (!updatedFlexMessage.contents) {
          updatedFlexMessage.contents = [];
        }
        // For carousel, we need to add to the first bubble or create one
        if (updatedFlexMessage.contents.length === 0) {
          updatedFlexMessage.contents.push({
            type: 'bubble',
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [newComponent]
            }
          });
        } else {
          if (!updatedFlexMessage.contents[0].body.contents) {
            updatedFlexMessage.contents[0].body.contents = [];
          }
          updatedFlexMessage.contents[0].body.contents.push(newComponent);
        }
      }
      
      // Update selected components to match the structure
      const allComponents = extractAllComponents(updatedFlexMessage);
      setSelectedComponents(allComponents);
      
    setFormData({
        ...formData,
        flex_message: updatedFlexMessage
      });
    }
  };

  const handleAddBlock = (blockId: string) => {
    const block = flexTemplates.blocks.find(b => b.id === blockId);
    if (block) {
      const newBlock = {
        ...block.template,
        id: `${blockId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      // Add block to bubble container
      const updatedFlexMessage = { ...formData.flex_message };
      if (updatedFlexMessage.type === 'bubble') {
        // Add the block directly to the bubble
        updatedFlexMessage[blockId] = newBlock;
      }
      
      // Update selected components to match the structure
      const allComponents = extractAllComponents(updatedFlexMessage);
      setSelectedComponents(allComponents);
      
      setFormData({
        ...formData,
        flex_message: updatedFlexMessage
      });
    }
  };

  const extractAllComponents = (structure: any): any[] => {
    const components: any[] = [];
    
    if (!structure) return components;
    
    // Helper function to add ID to component if missing
    const addIdIfMissing = (component: any, index: number) => {
      if (!component.id && component.type !== 'bubble' && component.type !== 'carousel') {
        component.id = `${component.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`;
      }
      return component;
    };
    
    if (structure.type !== 'bubble' && structure.type !== 'carousel') {
      components.push(addIdIfMissing(structure, components.length));
    }
    
    if (structure.contents && Array.isArray(structure.contents)) {
      for (let i = 0; i < structure.contents.length; i++) {
        const item = structure.contents[i];
        components.push(...extractAllComponents(item));
      }
    }
    
    if (structure.body && structure.body.contents && Array.isArray(structure.body.contents)) {
      for (let i = 0; i < structure.body.contents.length; i++) {
        const item = structure.body.contents[i];
        components.push(...extractAllComponents(item));
      }
    }
    
    // Also check for blocks (header, hero, body, footer)
    const blocks = ['header', 'hero', 'body', 'footer'];
    for (const block of blocks) {
      if (structure[block]) {
        components.push(...extractAllComponents(structure[block]));
      }
    }
    
    return components;
  };

  const handleRemoveComponent = (componentId: string) => {
    // Remove from flex message structure
    const updatedFlexMessage = { ...formData.flex_message };
    if (updatedFlexMessage.type === 'bubble' && updatedFlexMessage.body) {
      updatedFlexMessage.body.contents = updatedFlexMessage.body.contents?.filter((c: any) => c.id !== componentId) || [];
    } else if (updatedFlexMessage.type === 'carousel' && updatedFlexMessage.contents?.[0]?.body) {
      updatedFlexMessage.contents[0].body.contents = updatedFlexMessage.contents[0].body.contents?.filter((c: any) => c.id !== componentId) || [];
    }
    
    // Update selected components to match the structure
    const allComponents = extractAllComponents(updatedFlexMessage);
    setSelectedComponents(allComponents);
    
    setFormData({
      ...formData,
      flex_message: updatedFlexMessage
    });
  };

  const handleSelectElement = (elementId: string) => {
    console.log('Selecting element:', elementId);
    setSelectedElement(elementId);
    // Find the element in the structure
    const element = findElementById(formData.flex_message, elementId);
    console.log('Found element:', element);
    if (element) {
      setEditingElement(element);
      setShowElementEditor(true);
      } else {
      console.log('Element not found for ID:', elementId);
    }
  };

  const findElementById = (structure: any, elementId: string): any => {
    if (!structure) return null;
    
    if (structure.id === elementId) return structure;
    
    if (structure.contents && Array.isArray(structure.contents)) {
      for (const item of structure.contents) {
        const found = findElementById(item, elementId);
        if (found) return found;
      }
    }
    
    if (structure.body && structure.body.contents && Array.isArray(structure.body.contents)) {
      for (const item of structure.body.contents) {
        const found = findElementById(item, elementId);
        if (found) return found;
      }
    }
    
    // Check for blocks (header, hero, body, footer)
    const blocks = ['header', 'hero', 'body', 'footer'];
    for (const block of blocks) {
      if (structure[block]) {
        const found = findElementById(structure[block], elementId);
        if (found) return found;
      }
    }
    
    return null;
  };

  const handleUpdateElement = (elementId: string, updates: any) => {
    const newFlexMessage = { ...formData.flex_message };
    updateElementInStructure(newFlexMessage, elementId, updates);
    
    // Update selected components to match the structure
    const allComponents = extractAllComponents(newFlexMessage);
    setSelectedComponents(allComponents);
    
    setFormData({
      ...formData,
      flex_message: newFlexMessage
    });
    setShowElementEditor(false);
    setEditingElement(null);
    setSelectedElement(null);
  };

  const updateElementInStructure = (structure: any, elementId: string, updates: any): boolean => {
    if (!structure) return false;
    
    if (structure.id === elementId) {
      Object.assign(structure, updates);
      return true;
    }
    
    if (structure.contents && Array.isArray(structure.contents)) {
      for (const item of structure.contents) {
        if (updateElementInStructure(item, elementId, updates)) {
          return true;
        }
      }
    }
    
    if (structure.body && structure.body.contents && Array.isArray(structure.body.contents)) {
      for (const item of structure.body.contents) {
        if (updateElementInStructure(item, elementId, updates)) {
          return true;
        }
      }
    }
    
    // Check for blocks (header, hero, body, footer)
    const blocks = ['header', 'hero', 'body', 'footer'];
    for (const block of blocks) {
      if (structure[block]) {
        if (updateElementInStructure(structure[block], elementId, updates)) {
          return true;
        }
      }
    }
    
    return false;
  };

  const handleDeleteElement = (elementId: string) => {
    const newFlexMessage = { ...formData.flex_message };
    removeElementFromStructure(newFlexMessage, elementId);
    
    // Update selected components to match the structure
    const allComponents = extractAllComponents(newFlexMessage);
    setSelectedComponents(allComponents);
    
    setFormData({
      ...formData,
      flex_message: newFlexMessage
    });
    setShowElementEditor(false);
    setEditingElement(null);
  };

  const removeElementFromStructure = (structure: any, elementId: string): boolean => {
    if (!structure) return false;
    
    if (structure.contents && Array.isArray(structure.contents)) {
      const index = structure.contents.findIndex((item: any) => item.id === elementId);
      if (index !== -1) {
        structure.contents.splice(index, 1);
        return true;
      }
      for (const item of structure.contents) {
        if (removeElementFromStructure(item, elementId)) {
          return true;
        }
      }
    }
    
    if (structure.body && structure.body.contents && Array.isArray(structure.body.contents)) {
      const index = structure.body.contents.findIndex((item: any) => item.id === elementId);
      if (index !== -1) {
        structure.body.contents.splice(index, 1);
        return true;
      }
      for (const item of structure.body.contents) {
        if (removeElementFromStructure(item, elementId)) {
          return true;
        }
      }
    }
    
    // Check for blocks (header, hero, body, footer)
    const blocks = ['header', 'hero', 'body', 'footer'];
    for (const block of blocks) {
      if (structure[block]) {
        if (removeElementFromStructure(structure[block], elementId)) {
          return true;
        }
      }
    }
    
    return false;
  };

  const getTextSize = (size: string): string => {
    switch (size) {
      case 'xs': return '0.75rem';
      case 'sm': return '0.875rem';
      case 'md': return '1rem';
      case 'lg': return '1.125rem';
      case 'xl': return '1.25rem';
      case 'xxl': return '1.5rem';
      case '3xl': return '1.875rem';
      default: return '1rem';
    }
  };

  const getImageSize = (size: string): string => {
    switch (size) {
      case 'xs': return '40px';
      case 'sm': return '50px';
      case 'md': return '60px';
      case 'lg': return '80px';
      case 'xl': return '100px';
      case 'xxl': return '120px';
      case '3xl': return '150px';
      case 'full': return '100%';
      default: return '60px';
    }
  };

  const getBubbleSize = (size: string): string => {
    switch (size) {
      case 'nano': return '200px';
      case 'micro': return '250px';
      case 'deca': return '300px';
      case 'hecto': return '350px';
      case 'kilo': return '400px';
      case 'mega': return '450px';
      case 'giga': return '500px';
      default: return '450px';
    }
  };

  const VisualFlexMessagePreview: React.FC<{ 
    flexMessage: any; 
    onElementClick?: (elementId: string) => void;
    selectedElementId?: string | null;
  }> = ({ flexMessage, onElementClick, selectedElementId }) => {
    const renderFlexContent = (content: any, depth: number = 0): React.ReactNode => {
      if (!content) return null;

      const commonStyles = {
        border: content.id === selectedElementId ? '2px solid #1976d2' : '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '8px',
        margin: '4px 0',
        backgroundColor: content.id === selectedElementId ? '#e3f2fd' : '#fafafa',
        fontSize: '12px',
        fontFamily: 'monospace',
        cursor: onElementClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        '&:hover': onElementClick ? {
          backgroundColor: '#f0f0f0',
          borderColor: '#1976d2'
        } : {}
      };

      const containerStyles = {
        ...commonStyles,
        backgroundColor: depth === 0 ? '#e3f2fd' : '#f5f5f5',
        borderColor: depth === 0 ? '#2196f3' : '#e0e0e0'
      };

      switch (content.type) {
        case 'bubble':
    return (
            <Box sx={containerStyles}>
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
                📦 Bubble Container
              </Typography>
              {content.header && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" sx={{ color: '#666' }}>Header:</Typography>
                  {renderFlexContent(content.header, depth + 1)}
                </Box>
              )}
              {content.body && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" sx={{ color: '#666' }}>Body:</Typography>
                  {renderFlexContent(content.body, depth + 1)}
                </Box>
              )}
              {content.footer && (
                <Box>
                  <Typography variant="caption" sx={{ color: '#666' }}>Footer:</Typography>
                  {renderFlexContent(content.footer, depth + 1)}
                </Box>
              )}
      </Box>
    );

        case 'box':
  return (
            <Box sx={containerStyles}>
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
                📦 Box ({content.layout || 'vertical'})
        </Typography>
              {content.contents && Array.isArray(content.contents) && (
                <Box sx={{ pl: 1 }}>
                  {content.contents.map((item: any, index: number) => (
                    <Box key={index} sx={{ mb: 0.5 }}>
                      {renderFlexContent(item, depth + 1)}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          );

        case 'text':
          console.log('Text preview - content:', content);
          console.log('Text preview - content.text:', content.text);
          return (
            <Box 
              sx={commonStyles}
              onClick={() => onElementClick && content.id && onElementClick(content.id)}
            >
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                📝 Text ({content.size || 'md'})
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: content.weight === 'bold' ? 'bold' : 'normal',
                  fontSize: getTextSize(content.size),
                  color: content.color || '#000',
                  textAlign: content.align || 'start',
                  whiteSpace: content.wrap ? 'pre-wrap' : 'nowrap',
                  overflow: content.wrap ? 'visible' : 'hidden',
                  textOverflow: content.wrap ? 'clip' : 'ellipsis',
                  lineHeight: content.lineSpacing || 'normal',
                  maxHeight: content.maxLines ? `${content.maxLines * 1.2}em` : 'none',
                  position: content.position || 'relative',
                  top: content.position === 'absolute' ? content.offsetTop : 'auto',
                  bottom: content.position === 'absolute' ? content.offsetBottom : 'auto',
                  left: content.position === 'absolute' ? content.offsetStart : 'auto',
                  right: content.position === 'absolute' ? content.offsetEnd : 'auto',
                  flex: content.flex || 0,
                  margin: content.margin === 'none' ? 0 : content.margin === 'xs' ? '4px' : 
                         content.margin === 'sm' ? '8px' : content.margin === 'md' ? '12px' : 
                         content.margin === 'lg' ? '16px' : content.margin === 'xl' ? '20px' : 
                         content.margin === 'xxl' ? '24px' : 0
                }}
              >
                {content.text || 'Sample text'} {/* Debug: content.text = "${content.text}" */}
              </Typography>
              <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 0.5 }}>
                {content.wrap && 'Wrapped'} {content.maxLines > 0 && `${content.maxLines} lines max`} 
                {content.position === 'absolute' && ' (Absolute)'} {content.flex > 0 && `Flex: ${content.flex}`}
              </Typography>
            </Box>
          );

        case 'button':
          return (
            <Box 
              sx={commonStyles}
              onClick={() => onElementClick && content.id && onElementClick(content.id)}
            >
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                🔘 Button ({content.action?.type || 'postback'})
              </Typography>
        <Button
                variant={content.style === 'primary' ? 'contained' : 'outlined'}
                size="small"
                sx={{ 
                  fontSize: '0.75rem',
                  minWidth: '80px',
                  bgcolor: content.color || undefined,
                  height: content.height === 'md' ? '40px' : '32px'
                }}
              >
                {content.action?.label || 'Button'}
        </Button>
              <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 0.5 }}>
                {content.action?.type === 'postback' && `Data: ${content.action?.data}`}
                {content.action?.type === 'message' && `Text: ${content.action?.text}`}
                {content.action?.type === 'uri' && `URL: ${content.action?.uri}`}
                {content.action?.type === 'datetimepicker' && `Mode: ${content.action?.mode}`}
                {content.action?.type === 'camera' && 'Camera Action'}
                {content.action?.type === 'cameraRoll' && 'Camera Roll Action'}
                {content.action?.type === 'location' && 'Location Action'}
                {content.action?.type === 'richmenuswitch' && `Menu: ${content.action?.richMenuAliasId}`}
                {content.action?.type === 'clipboard' && `Copy: ${content.action?.text}`}
              </Typography>
      </Box>
          );

        case 'image':
          return (
            <Box 
              sx={commonStyles}
              onClick={() => onElementClick && content.id && onElementClick(content.id)}
            >
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                🖼️ Image ({content.size || 'md'})
              </Typography>
              <Box 
                sx={{ 
                  width: getImageSize(content.size),
                  height: getImageSize(content.size),
                  bgcolor: '#e0e0e0', 
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  color: '#666',
                  aspectRatio: content.aspectRatio || '1:1'
                }}
              >
                IMAGE
              </Box>
            </Box>
          );

        case 'icon':
          return (
            <Box 
              sx={commonStyles}
              onClick={() => onElementClick && content.id && onElementClick(content.id)}
            >
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                😊 Icon ({content.size || 'md'})
              </Typography>
              <Box 
                sx={{ 
                  width: getImageSize(content.size),
                  height: getImageSize(content.size),
                  bgcolor: '#e0e0e0', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: getTextSize(content.size)
                }}
              >
                😊
              </Box>
            </Box>
          );

        case 'video':
          return (
            <Box 
              sx={commonStyles}
              onClick={() => onElementClick && content.id && onElementClick(content.id)}
            >
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                🎥 Video
              </Typography>
              <Box 
                sx={{ 
                  width: '200px',
                  height: '120px',
                  bgcolor: '#e0e0e0', 
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  color: '#666',
                  position: 'relative'
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ fontSize: '2rem', mb: 1 }}>🎥</Typography>
                  <Typography variant="caption">Video Content</Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 0.5 }}>
                URL: {content.url || 'Not set'} | Preview: {content.previewUrl || 'Not set'}
              </Typography>
            </Box>
          );

        case 'separator':
          return (
            <Box 
              sx={commonStyles}
              onClick={() => onElementClick && content.id && onElementClick(content.id)}
            >
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                ➖ Separator
                  </Typography>
              <Box 
                sx={{ 
                  height: '1px',
                  bgcolor: '#e0e0e0',
                  width: '100%',
                  my: 1
                }}
              />
                </Box>
          );

        case 'spacer':
          return (
            <Box 
              sx={commonStyles}
              onClick={() => onElementClick && content.id && onElementClick(content.id)}
            >
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                📏 Spacer ({content.size || 'md'})
              </Typography>
              <Box 
                sx={{ 
                  height: content.size === 'xs' ? '4px' : content.size === 'sm' ? '8px' : 
                         content.size === 'md' ? '12px' : content.size === 'lg' ? '16px' : 
                         content.size === 'xl' ? '20px' : content.size === 'xxl' ? '24px' : '12px',
                  bgcolor: '#f0f0f0',
                  width: '100%',
                  border: '1px dashed #ccc'
                }}
              />
            </Box>
          );

        case 'filler':
          return (
            <Box 
              sx={commonStyles}
              onClick={() => onElementClick && content.id && onElementClick(content.id)}
            >
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                ⬜ Filler (Deprecated) - Flex: {content.flex || 1}
                            </Typography>
              <Box 
                sx={{ 
                  height: '20px',
                  bgcolor: '#fff3cd',
                  width: '100%',
                  border: '1px dashed #ffc107',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  color: '#856404'
                }}
              >
                FILLER
              </Box>
            </Box>
          );

        default:
          return (
            <Box sx={commonStyles}>
              <Typography variant="caption" sx={{ color: '#666' }}>
                Unknown: {content.type}
                            </Typography>
            </Box>
          );
      }
    };

    return (
      <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 1, border: '1px solid #e0e0e0' }}>
        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartphoneIcon />
          Visual Preview
                            </Typography>
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {flexMessage?.type === 'bubble' ? (
            <Box sx={{ 
              border: '1px solid #ccc', 
              borderRadius: 2, 
              p: 2, 
              bgcolor: 'white',
              maxWidth: getBubbleSize(flexMessage.size)
            }}>
              {/* Header Block */}
              {flexMessage.header && renderFlexContent(flexMessage.header)}
              
              {/* Hero Block */}
              {flexMessage.hero && renderFlexContent(flexMessage.hero)}
              
              {/* Body Block */}
              {flexMessage.body && renderFlexContent(flexMessage.body)}
              
              {/* Footer Block */}
              {flexMessage.footer && renderFlexContent(flexMessage.footer)}
            </Box>
          ) : flexMessage?.contents ? (
            renderFlexContent(flexMessage.contents)
          ) : (
                            <Typography variant="body2" color="text.secondary">
              No flex message content to preview
                            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  // Element Editor Component
  const ElementEditor: React.FC<{
    element: any;
    onUpdate: (updates: any) => void;
    onDelete: () => void;
    onClose: () => void;
  }> = ({ element, onUpdate, onDelete, onClose }) => {
    const [formData, setFormData] = useState<any>({});
    const [initialized, setInitialized] = useState(false);

    // Initialize formData only once when element is first set
    useEffect(() => {
      console.log('ElementEditor received element:', element);
      if (element && !initialized) {
        const newFormData = { ...element };
        console.log('Setting formData to:', newFormData);
        setFormData(newFormData);
        setInitialized(true);
      }
    }, [element, initialized]);

    // Reset initialized state when element changes (for different elements)
    useEffect(() => {
      if (element && initialized) {
        // Check if this is a different element (different ID)
        if (formData.id !== element.id) {
          console.log('Different element detected, resetting formData');
          setFormData({ ...element });
        }
      }
    }, [element?.id, initialized, formData.id]);

    const handleSave = () => {
      onUpdate(formData);
    };

    const renderTextEditor = () => (
      <Box>
        <TextField
          fullWidth
          label="Text Content"
          value={(formData.text !== undefined ? formData : element).text || ''}
          onChange={(e) => setFormData({ ...formData, text: e.target.value })}
          margin="normal"
          multiline
          rows={3}
        />
        
        {/* Text Styling */}
        <FormControl fullWidth margin="normal">
          <InputLabel>Size</InputLabel>
          <Select
            value={formData.size || 'md'}
            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
            label="Size"
          >
            <MenuItem value="xs">Extra Small (xs)</MenuItem>
            <MenuItem value="sm">Small (sm)</MenuItem>
            <MenuItem value="md">Medium (md)</MenuItem>
            <MenuItem value="lg">Large (lg)</MenuItem>
            <MenuItem value="xl">Extra Large (xl)</MenuItem>
            <MenuItem value="xxl">2X Large (xxl)</MenuItem>
            <MenuItem value="3xl">3X Large (3xl)</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl fullWidth margin="normal">
          <InputLabel>Weight</InputLabel>
          <Select
            value={formData.weight || 'regular'}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            label="Weight"
          >
            <MenuItem value="regular">Regular</MenuItem>
            <MenuItem value="bold">Bold</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          fullWidth
          label="Color"
          value={formData.color || '#000000'}
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          margin="normal"
          type="color"
        />
        
        {/* Text Layout */}
        <FormControl fullWidth margin="normal">
          <InputLabel>Alignment</InputLabel>
          <Select
            value={formData.align || 'start'}
            onChange={(e) => setFormData({ ...formData, align: e.target.value })}
            label="Alignment"
          >
            <MenuItem value="start">Start</MenuItem>
            <MenuItem value="end">End</MenuItem>
            <MenuItem value="center">Center</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl fullWidth margin="normal">
          <InputLabel>Gravity</InputLabel>
          <Select
            value={formData.gravity || 'top'}
            onChange={(e) => setFormData({ ...formData, gravity: e.target.value })}
            label="Gravity"
          >
            <MenuItem value="top">Top</MenuItem>
            <MenuItem value="bottom">Bottom</MenuItem>
            <MenuItem value="center">Center</MenuItem>
          </Select>
        </FormControl>
        
        {/* Text Wrapping */}
        <FormControlLabel
          control={
            <Switch
              checked={formData.wrap || false}
              onChange={(e) => setFormData({ ...formData, wrap: e.target.checked })}
            />
          }
          label="Text Wrapping"
        />
        
        {formData.wrap && (
          <TextField
            fullWidth
            label="Line Spacing (e.g., 20px)"
            value={formData.lineSpacing || ''}
            onChange={(e) => setFormData({ ...formData, lineSpacing: e.target.value })}
            margin="normal"
            helperText="Line spacing for wrapped text (e.g., 20px)"
          />
        )}
        
                <TextField
                  fullWidth
          label="Max Lines"
          value={formData.maxLines || 0}
          onChange={(e) => setFormData({ ...formData, maxLines: parseInt(e.target.value) || 0 })}
                  margin="normal"
          type="number"
          inputProps={{ min: 0 }}
          helperText="0 = no limit, 1+ = maximum lines to show"
        />
        
        {/* Layout Properties */}
        <TextField
          fullWidth
          label="Flex"
          value={formData.flex || 0}
          onChange={(e) => setFormData({ ...formData, flex: parseInt(e.target.value) || 0 })}
          margin="normal"
          type="number"
          inputProps={{ min: 0, max: 10 }}
          helperText="Flex ratio (0-10)"
        />
        
                <FormControl fullWidth margin="normal">
          <InputLabel>Margin</InputLabel>
                  <Select
            value={formData.margin || 'none'}
            onChange={(e) => setFormData({ ...formData, margin: e.target.value })}
            label="Margin"
          >
            <MenuItem value="none">None</MenuItem>
            <MenuItem value="xs">Extra Small</MenuItem>
            <MenuItem value="sm">Small</MenuItem>
            <MenuItem value="md">Medium</MenuItem>
            <MenuItem value="lg">Large</MenuItem>
            <MenuItem value="xl">Extra Large</MenuItem>
            <MenuItem value="xxl">2X Large</MenuItem>
                  </Select>
                </FormControl>
        
        {/* Position Properties */}
        <FormControl fullWidth margin="normal">
          <InputLabel>Position</InputLabel>
          <Select
            value={formData.position || 'relative'}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            label="Position"
          >
            <MenuItem value="relative">Relative</MenuItem>
            <MenuItem value="absolute">Absolute</MenuItem>
          </Select>
        </FormControl>
        
        {formData.position === 'absolute' && (
          <>
                <TextField
                  fullWidth
              label="Offset Top (e.g., 0px, 10px)"
              value={formData.offsetTop || '0px'}
              onChange={(e) => setFormData({ ...formData, offsetTop: e.target.value })}
                  margin="normal"
              helperText="Distance from top"
                />
                <TextField
                  fullWidth
              label="Offset Bottom (e.g., 0px, 10px)"
              value={formData.offsetBottom || '0px'}
              onChange={(e) => setFormData({ ...formData, offsetBottom: e.target.value })}
                  margin="normal"
              helperText="Distance from bottom"
            />
            <TextField
              fullWidth
              label="Offset Start (e.g., 0px, 10px)"
              value={formData.offsetStart || '0px'}
              onChange={(e) => setFormData({ ...formData, offsetStart: e.target.value })}
              margin="normal"
              helperText="Distance from start"
            />
            <TextField
              fullWidth
              label="Offset End (e.g., 0px, 10px)"
              value={formData.offsetEnd || '0px'}
              onChange={(e) => setFormData({ ...formData, offsetEnd: e.target.value })}
              margin="normal"
              helperText="Distance from end"
            />
          </>
        )}
        
        {/* Text Adjustment */}
        <FormControl fullWidth margin="normal">
          <InputLabel>Adjust Mode</InputLabel>
          <Select
            value={formData.adjustMode || 'shrink-to-fit'}
            onChange={(e) => setFormData({ ...formData, adjustMode: e.target.value })}
            label="Adjust Mode"
          >
            <MenuItem value="shrink-to-fit">Shrink to Fit</MenuItem>
            <MenuItem value="none">None</MenuItem>
          </Select>
        </FormControl>
        
                <FormControlLabel
                  control={
                    <Switch
              checked={formData.scaling || false}
              onChange={(e) => setFormData({ ...formData, scaling: e.target.checked })}
            />
          }
          label="Text Scaling"
        />
      </Box>
    );

    const renderButtonEditor = () => (
      <Box>
        <TextField
          fullWidth
          label="Button Label"
          value={formData.action?.label || ''}
          onChange={(e) => setFormData({ 
            ...formData, 
            action: { ...formData.action, label: e.target.value }
          })}
          margin="normal"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Button Style</InputLabel>
          <Select
            value={formData.style || 'primary'}
            onChange={(e) => setFormData({ ...formData, style: e.target.value })}
            label="Button Style"
          >
            <MenuItem value="primary">Primary</MenuItem>
            <MenuItem value="secondary">Secondary</MenuItem>
            <MenuItem value="link">Link</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>Action Type</InputLabel>
          <Select
            value={formData.action?.type || 'postback'}
            onChange={(e) => {
              const actionType = e.target.value;
              let newAction: any = { type: actionType };
              
              // Set default properties based on action type
              switch (actionType) {
                case 'postback':
                  newAction = { ...newAction, label: formData.action?.label || 'Button', data: formData.action?.data || 'action=button' };
                  break;
                case 'message':
                  newAction = { ...newAction, label: formData.action?.label || 'Button', text: formData.action?.text || 'Hello' };
                  break;
                case 'uri':
                  newAction = { ...newAction, label: formData.action?.label || 'Button', uri: formData.action?.uri || 'https://example.com' };
                  break;
                case 'datetimepicker':
                  newAction = { ...newAction, label: formData.action?.label || 'Select Date', data: formData.action?.data || 'action=datetime', mode: 'date' };
                  break;
                case 'camera':
                  newAction = { ...newAction, label: formData.action?.label || 'Camera' };
                  break;
                case 'cameraRoll':
                  newAction = { ...newAction, label: formData.action?.label || 'Camera Roll' };
                  break;
                case 'location':
                  newAction = { ...newAction, label: formData.action?.label || 'Location' };
                  break;
                case 'richmenuswitch':
                  newAction = { ...newAction, label: formData.action?.label || 'Switch Menu', richMenuAliasId: formData.action?.richMenuAliasId || 'menu1', data: formData.action?.data || 'action=switch' };
                  break;
                case 'clipboard':
                  newAction = { ...newAction, label: formData.action?.label || 'Copy', text: formData.action?.text || 'Text to copy' };
                  break;
              }
              
              setFormData({ 
                ...formData, 
                action: newAction
              });
            }}
            label="Action Type"
          >
            <MenuItem value="postback">Postback</MenuItem>
            <MenuItem value="message">Message</MenuItem>
            <MenuItem value="uri">URI</MenuItem>
            <MenuItem value="datetimepicker">Date/Time Picker</MenuItem>
            <MenuItem value="camera">Camera</MenuItem>
            <MenuItem value="cameraRoll">Camera Roll</MenuItem>
            <MenuItem value="location">Location</MenuItem>
            <MenuItem value="richmenuswitch">Rich Menu Switch</MenuItem>
            <MenuItem value="clipboard">Clipboard</MenuItem>
          </Select>
        </FormControl>
        
        {/* Action-specific fields */}
        {formData.action?.type === 'postback' && (
          <TextField
            fullWidth
            label="Postback Data"
            value={formData.action?.data || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              action: { ...formData.action, data: e.target.value }
            })}
            margin="normal"
            helperText="Data sent when button is pressed"
          />
        )}
        
        {formData.action?.type === 'message' && (
          <TextField
            fullWidth
            label="Message Text"
            value={formData.action?.text || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              action: { ...formData.action, text: e.target.value }
            })}
            margin="normal"
            helperText="Text message sent when button is pressed"
          />
        )}
        
        {formData.action?.type === 'uri' && (
          <TextField
            fullWidth
            label="URI"
            value={formData.action?.uri || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              action: { ...formData.action, uri: e.target.value }
            })}
            margin="normal"
            helperText="URL to open when button is pressed"
          />
        )}
        
        {formData.action?.type === 'datetimepicker' && (
          <>
            <TextField
              fullWidth
              label="Datetime Data"
              value={formData.action?.data || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                action: { ...formData.action, data: e.target.value }
              })}
              margin="normal"
              helperText="Data sent when date/time is selected"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Mode</InputLabel>
              <Select
                value={formData.action?.mode || 'date'}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  action: { ...formData.action, mode: e.target.value }
                })}
                label="Mode"
              >
                <MenuItem value="date">Date</MenuItem>
                <MenuItem value="time">Time</MenuItem>
                <MenuItem value="datetime">Date & Time</MenuItem>
              </Select>
            </FormControl>
          </>
        )}
        
        {formData.action?.type === 'richmenuswitch' && (
          <>
            <TextField
              fullWidth
              label="Rich Menu Alias ID"
              value={formData.action?.richMenuAliasId || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                action: { ...formData.action, richMenuAliasId: e.target.value }
              })}
              margin="normal"
              helperText="Rich menu alias ID to switch to"
            />
            <TextField
              fullWidth
              label="Switch Data"
              value={formData.action?.data || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                action: { ...formData.action, data: e.target.value }
              })}
              margin="normal"
              helperText="Data sent when menu is switched"
            />
          </>
        )}
        
        {formData.action?.type === 'clipboard' && (
          <TextField
            fullWidth
            label="Clipboard Text"
            value={formData.action?.text || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              action: { ...formData.action, text: e.target.value }
            })}
            margin="normal"
            helperText="Text to copy to clipboard"
          />
        )}
        
        <TextField
          fullWidth
          label="Button Color"
          value={formData.color || '#000000'}
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          margin="normal"
          type="color"
        />
        
        <FormControl fullWidth margin="normal">
          <InputLabel>Height</InputLabel>
          <Select
            value={formData.height || 'sm'}
            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
            label="Height"
          >
            <MenuItem value="sm">Small</MenuItem>
            <MenuItem value="md">Medium</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl fullWidth margin="normal">
          <InputLabel>Gravity</InputLabel>
          <Select
            value={formData.gravity || 'top'}
            onChange={(e) => setFormData({ ...formData, gravity: e.target.value })}
            label="Gravity"
          >
            <MenuItem value="top">Top</MenuItem>
            <MenuItem value="bottom">Bottom</MenuItem>
            <MenuItem value="center">Center</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl fullWidth margin="normal">
          <InputLabel>Margin</InputLabel>
          <Select
            value={formData.margin || 'none'}
            onChange={(e) => setFormData({ ...formData, margin: e.target.value })}
            label="Margin"
          >
            <MenuItem value="none">None</MenuItem>
            <MenuItem value="xs">Extra Small</MenuItem>
            <MenuItem value="sm">Small</MenuItem>
            <MenuItem value="md">Medium</MenuItem>
            <MenuItem value="lg">Large</MenuItem>
            <MenuItem value="xl">Extra Large</MenuItem>
            <MenuItem value="xxl">2X Large</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          fullWidth
          label="Flex"
          value={formData.flex || 0}
          onChange={(e) => setFormData({ ...formData, flex: parseInt(e.target.value) || 0 })}
          margin="normal"
          type="number"
          inputProps={{ min: 0, max: 10 }}
          helperText="Flex ratio (0-10)"
        />
      </Box>
    );

    const renderImageEditor = () => (
      <Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            label="Image URL"
            value={formData.url || ''}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            margin="normal"
            helperText="Enter image URL or use upload button"
          />
          <Button
            variant="outlined"
            onClick={() => {
              console.log('Opening image upload dialog...');
              setFileUploadDialog({
                open: true,
                fileType: 'image',
                onSelect: (fileData) => {
                  console.log('Image selected:', fileData);
                  const updatedFormData = { ...formData, url: fileData.url };
                  setFormData(updatedFormData);
                  // Also update the editingElement to persist the change
                  setEditingElement(updatedFormData);
                  setSnackbar({
                    open: true,
                    message: `Image uploaded successfully: ${fileData.filename}`,
                    severity: 'success'
                  });
                }
              });
            }}
            sx={{ mt: 1, minWidth: '120px' }}
          >
            Upload Image
          </Button>
        </Box>
        <FormControl fullWidth margin="normal">
          <InputLabel>Size</InputLabel>
          <Select
            value={formData.size || 'md'}
            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
            label="Size"
          >
            <MenuItem value="xs">Extra Small (xs)</MenuItem>
            <MenuItem value="sm">Small (sm)</MenuItem>
            <MenuItem value="md">Medium (md)</MenuItem>
            <MenuItem value="lg">Large (lg)</MenuItem>
            <MenuItem value="xl">Extra Large (xl)</MenuItem>
            <MenuItem value="xxl">2X Large (xxl)</MenuItem>
            <MenuItem value="3xl">3X Large (3xl)</MenuItem>
            <MenuItem value="full">Full Width</MenuItem>
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label="Aspect Ratio (e.g., 2:1, 1:1, 4:3)"
          value={formData.aspectRatio || ''}
          onChange={(e) => setFormData({ ...formData, aspectRatio: e.target.value })}
          margin="normal"
          helperText="Aspect ratio for the image (e.g., 2:1, 1:1, 4:3)"
        />
                    </Box>
    );

    const renderIconEditor = () => (
      <Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            label="Icon URL"
            value={formData.url || ''}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            margin="normal"
            helperText="Enter icon URL or use upload button"
          />
          <Button
            variant="outlined"
            onClick={() => {
              console.log('Opening icon upload dialog...');
              setFileUploadDialog({
                open: true,
                fileType: 'image',
                onSelect: (fileData) => {
                  console.log('Icon selected:', fileData);
                  const updatedFormData = { ...formData, url: fileData.url };
                  setFormData(updatedFormData);
                  // Also update the editingElement to persist the change
                  setEditingElement(updatedFormData);
                  setSnackbar({
                    open: true,
                    message: `Icon uploaded successfully: ${fileData.filename}`,
                    severity: 'success'
                  });
                }
              });
            }}
            sx={{ mt: 1, minWidth: '120px' }}
          >
            Upload Icon
          </Button>
        </Box>
        <FormControl fullWidth margin="normal">
          <InputLabel>Size</InputLabel>
          <Select
            value={formData.size || 'md'}
            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
            label="Size"
          >
            <MenuItem value="xs">Extra Small (xs)</MenuItem>
            <MenuItem value="sm">Small (sm)</MenuItem>
            <MenuItem value="md">Medium (md)</MenuItem>
            <MenuItem value="lg">Large (lg)</MenuItem>
            <MenuItem value="xl">Extra Large (xl)</MenuItem>
            <MenuItem value="xxl">2X Large (xxl)</MenuItem>
            <MenuItem value="3xl">3X Large (3xl)</MenuItem>
          </Select>
        </FormControl>
                  </Box>
    );

    const renderBoxEditor = () => (
      <Box>
        <FormControl fullWidth margin="normal">
          <InputLabel>Layout</InputLabel>
          <Select
            value={formData.layout || 'vertical'}
            onChange={(e) => setFormData({ ...formData, layout: e.target.value })}
            label="Layout"
          >
            <MenuItem value="vertical">Vertical</MenuItem>
            <MenuItem value="horizontal">Horizontal</MenuItem>
            <MenuItem value="baseline">Baseline</MenuItem>
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label="Background Color"
          value={formData.backgroundColor || ''}
          onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
          margin="normal"
          type="color"
        />
      </Box>
    );

    const renderBubbleEditor = () => (
      <Box>
        <FormControl fullWidth margin="normal">
          <InputLabel>Bubble Size</InputLabel>
          <Select
            value={formData.size || 'mega'}
            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
            label="Bubble Size"
          >
            <MenuItem value="nano">Nano</MenuItem>
            <MenuItem value="micro">Micro</MenuItem>
            <MenuItem value="deca">Deca</MenuItem>
            <MenuItem value="hecto">Hecto</MenuItem>
            <MenuItem value="kilo">Kilo</MenuItem>
            <MenuItem value="mega">Mega (Default)</MenuItem>
            <MenuItem value="giga">Giga</MenuItem>
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label="Background Color"
          value={formData.backgroundColor || ''}
          onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
          margin="normal"
          type="color"
        />
      </Box>
    );

    const renderVideoEditor = () => (
      <Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            label="Video URL (MP4)"
            value={formData.url || ''}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            margin="normal"
            helperText="Must be a valid MP4 video URL"
          />
          <Button
            variant="outlined"
            onClick={() => {
              console.log('Opening video upload dialog...');
              setFileUploadDialog({
                open: true,
                fileType: 'video',
                onSelect: (fileData) => {
                  console.log('Video selected:', fileData);
                  const updatedFormData = { 
                    ...formData, 
                    url: fileData.url,
                    previewUrl: fileData.previewUrl || formData.previewUrl
                  };
                  setFormData(updatedFormData);
                  // Also update the editingElement to persist the change
                  setEditingElement(updatedFormData);
                  setSnackbar({
                    open: true,
                    message: `Video uploaded successfully: ${fileData.filename}`,
                    severity: 'success'
                  });
                }
              });
            }}
            sx={{ mt: 1, minWidth: '120px' }}
          >
            Upload Video
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            label="Preview Image URL"
            value={formData.previewUrl || ''}
            onChange={(e) => setFormData({ ...formData, previewUrl: e.target.value })}
            margin="normal"
            helperText="Preview image shown before video plays"
          />
          <Button
            variant="outlined"
            onClick={() => {
              console.log('Opening preview image upload dialog...');
              setFileUploadDialog({
                open: true,
                fileType: 'image',
                onSelect: (fileData) => {
                  console.log('Preview image selected:', fileData);
                  const updatedFormData = { ...formData, previewUrl: fileData.url };
                  setFormData(updatedFormData);
                  // Also update the editingElement to persist the change
                  setEditingElement(updatedFormData);
                  setSnackbar({
                    open: true,
                    message: `Preview image uploaded successfully: ${fileData.filename}`,
                    severity: 'success'
                  });
                }
              });
            }}
            sx={{ mt: 1, minWidth: '120px' }}
          >
            Upload Preview
          </Button>
        </Box>
        <TextField
          fullWidth
          label="Alt Text"
          value={formData.altContent?.contents?.[0]?.text || ''}
          onChange={(e) => setFormData({ 
            ...formData, 
            altContent: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: e.target.value,
                  size: 'lg',
                  weight: 'bold'
                }
              ]
            }
          })}
          margin="normal"
          helperText="Text shown when video is not available"
        />
      </Box>
    );

    const renderSpacerEditor = () => (
      <Box>
        <FormControl fullWidth margin="normal">
          <InputLabel>Size</InputLabel>
          <Select
            value={formData.size || 'md'}
            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
            label="Size"
          >
            <MenuItem value="xs">Extra Small (xs)</MenuItem>
            <MenuItem value="sm">Small (sm)</MenuItem>
            <MenuItem value="md">Medium (md)</MenuItem>
            <MenuItem value="lg">Large (lg)</MenuItem>
            <MenuItem value="xl">Extra Large (xl)</MenuItem>
            <MenuItem value="xxl">2X Large (xxl)</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Spacer adds flexible space between components. The size determines the amount of space.
        </Typography>
      </Box>
    );

    const renderFillerEditor = () => (
      <Box>
        <TextField
          fullWidth
          label="Flex"
          value={formData.flex || 1}
          onChange={(e) => setFormData({ ...formData, flex: parseInt(e.target.value) || 1 })}
          margin="normal"
          type="number"
          inputProps={{ min: 1, max: 10 }}
          helperText="Flex ratio (1-10) - determines how much space to take"
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          <strong>Note:</strong> Filler is deprecated. Consider using spacing properties on other components instead.
        </Typography>
      </Box>
    );

    const renderEditor = () => {
      // Use formData.type if available, otherwise fall back to element.type
      const elementType = formData.type || element.type;
      console.log('renderEditor - formData.type:', formData.type);
      console.log('renderEditor - element.type:', element.type);
      console.log('renderEditor - using elementType:', elementType);
      
      switch (elementType) {
        case 'text':
          return renderTextEditor();
        case 'button':
          return renderButtonEditor();
        case 'image':
          return renderImageEditor();
        case 'icon':
          return renderIconEditor();
        case 'box':
          return renderBoxEditor();
        case 'bubble':
          return renderBubbleEditor();
        case 'span':
          return renderTextEditor(); // Use text editor for span
        case 'video':
          return renderVideoEditor();
        case 'spacer':
          return renderSpacerEditor();
        case 'filler':
          return renderFillerEditor();
        default:
          return (
            <Typography variant="body2" color="text.secondary">
              No specific editor available for this element type: {elementType}
            </Typography>
          );
      }
    };

    return (
      <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Edit {element.type} Element</Typography>
            <IconButton onClick={onDelete} color="error" size="small">
              <DeleteIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {renderEditor()}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Flex Message Designer Component
  const FlexMessageDesigner: React.FC = () => {
    return (
      <Dialog open={designerOpen} onClose={handleCloseDesigner} maxWidth="xl" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Flex Message Designer</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Open LINE Flex Message API Documentation">
                <Button 
                  variant="text" 
                  size="small"
                  startIcon={<OpenInNewIcon />}
                  onClick={() => window.open('https://developers.line.biz/en/docs/messaging-api/flex-message-elements/', '_blank')}
                  sx={{ textTransform: 'none' }}
                >
                  LINE API Docs
                </Button>
              </Tooltip>
              <Button onClick={handleSaveDesign} variant="contained" color="primary">
                Save Flex Message
              </Button>
              <Button onClick={handleCloseDesigner} variant="outlined">
                Close
              </Button>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Template Selection Panel */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: '600px', overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom>
                  <BuildIcon sx={{ mr: 1 }} />
                  Template Builder
                </Typography>
                
                {/* Container Selection */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">
                      <CategoryIcon sx={{ mr: 1 }} />
                      Container Type
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {flexTemplates.containers.map((container) => (
                        <ListItem 
                          key={container.id}
                          button
                          selected={selectedContainer === container.id}
                          onClick={() => handleSelectContainer(container.id)}
                          sx={{ 
                            border: selectedContainer === container.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                            borderRadius: 1,
                            mb: 1
                          }}
                        >
                          <ListItemIcon>{container.icon}</ListItemIcon>
                          <ListItemText 
                            primary={container.name}
                            secondary={container.description}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>

                {/* Documentation Section */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">
                      <OpenInNewIcon sx={{ mr: 1 }} />
                      Documentation
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="body2" gutterBottom>
                        <strong>LINE Flex Message Elements:</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        • <strong>Containers:</strong> Bubble (single message), Carousel (multiple messages)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        • <strong>Components:</strong> Box, Text, Button, Image, Video, Icon, Separator
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        • <strong>Sizes:</strong> xs, sm, md, lg, xl, xxl, 3xl
                      </Typography>
                      <Button 
                        variant="outlined" 
                        size="small"
                        startIcon={<OpenInNewIcon />}
                        onClick={() => window.open('https://developers.line.biz/en/docs/messaging-api/flex-message-elements/', '_blank')}
                        sx={{ mt: 1 }}
                      >
                        View Full Documentation
                      </Button>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {/* Block Selection */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">
                      <DashboardIcon sx={{ mr: 1 }} />
                      Blocks ({flexTemplates.blocks.length} total)
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {flexTemplates.blocks.map((block) => (
                        <ListItem 
                          key={block.id}
                          button
                          onClick={() => handleAddBlock(block.id)}
                          sx={{ 
                            border: '1px solid #e0e0e0',
                            borderRadius: 1,
                            mb: 0.5
                          }}
                        >
                          <ListItemIcon>{block.icon}</ListItemIcon>
                          <ListItemText 
                            primary={block.name}
                            secondary={block.description}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>

                {/* Component Selection */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">
                      <DragIndicatorIcon sx={{ mr: 1 }} />
                      Components ({flexTemplates.components.length} total)
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {['layout', 'content', 'interactive', 'media'].map((category) => {
                      const categoryComponents = flexTemplates.components.filter(comp => comp.category === category);
                      return (
                        <Box key={category} sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom sx={{ textTransform: 'capitalize' }}>
                            {category} ({categoryComponents.length})
                          </Typography>
                          <List dense>
                            {categoryComponents.map((component) => (
                              <ListItem 
                                key={component.id}
                                button
                                onClick={() => handleAddComponent(component.id)}
                                sx={{ 
                                  border: '1px solid #e0e0e0',
                                  borderRadius: 1,
                                  mb: 0.5
                                }}
                              >
                                <ListItemIcon>{component.icon}</ListItemIcon>
                                <ListItemText 
                                  primary={component.name}
                                  secondary={component.description}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      );
                    })}
                  </AccordionDetails>
                </Accordion>
              </Paper>
            </Grid>

            {/* Design Canvas */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, height: '600px', overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom>
                  <DashboardIcon sx={{ mr: 1 }} />
                  Design Canvas
                </Typography>
                
                {selectedContainer ? (
                      <Box>
                    <Chip 
                      label={`Container: ${flexTemplates.containers.find(c => c.id === selectedContainer)?.name}`}
                      color="primary"
                      sx={{ mb: 2 }}
                    />
                    
                    {/* Selected Components */}
                    {selectedComponents.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Selected Components:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {selectedComponents.map((component) => (
                            <Chip
                              key={component.id}
                              label={component.type}
                              onDelete={() => handleRemoveComponent(component.id)}
                              color="secondary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Live Preview */}
                    <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Live Preview (Click elements to edit):
                      </Typography>
                      <VisualFlexMessagePreview 
                        flexMessage={formData.flex_message} 
                        onElementClick={handleSelectElement}
                        selectedElementId={selectedElement}
                      />
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '100%',
                    color: '#666'
                  }}>
                    <ViewModuleIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" gutterBottom>
                      Start Designing
                    </Typography>
                    <Typography variant="body2" align="center">
                      Select a container type from the left panel to begin building your flex message
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    );
  };

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
            <SmartphoneIcon sx={{ fontSize: 28, color: 'white' }} />
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
              Flex Message Management
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
              Create and manage LINE Flex Messages for enhanced user experience
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
            sx={{
              '& .MuiToggleButton-root': {
                borderRadius: 2,
                border: '1px solid #e2e8f0',
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  }
                }
              }
            }}
          >
            <ToggleButton value="table" aria-label="table view">
              <TableChartIcon />
            </ToggleButton>
            <ToggleButton value="cards" aria-label="card view">
              <ViewModuleIcon />
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              px: 3
            }}
          >
            Create New Flex Message
          </Button>
        </Box>
      </Box>

      {/* Flex Messages Display */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : viewMode === 'table' ? (
        <Card sx={{ 
          mb: 3,
          background: 'white',
          borderRadius: 3,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>Purpose</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>Alt Text</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>Tags</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>Created</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
            <TableBody>
              {flexMessages.map((message) => (
                <TableRow key={message._id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {message.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={message.purpose === 'liff_message' ? 'LIFF' : 'BOT'} 
                      size="small" 
                      color={message.purpose === 'liff_message' ? 'primary' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }}>
                      {message.alt_text}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {message.tags.slice(0, 3).map((tag, index) => (
                        <Chip key={index} label={tag} size="small" variant="outlined" />
                      ))}
                      {message.tags.length > 3 && (
                        <Chip label={`+${message.tags.length - 3}`} size="small" variant="outlined" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {message.usertimestamp || new Date(message.created_at || '').toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handlePreview(message)}
                      color="primary"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(message)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(message._id!)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {flexMessages.map((message) => (
            <Grid item xs={12} md={6} lg={4} key={message._id}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                }
              }}>
                <CardContent sx={{ flex: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2" sx={{ 
                      wordBreak: 'break-word',
                      fontWeight: 600,
                      color: '#1e293b'
                    }}>
                      {message.name}
                    </Typography>
                    <Chip 
                      label={message.purpose === 'liff_message' ? 'LIFF' : 'BOT'} 
                      size="small" 
                      color={message.purpose === 'liff_message' ? 'primary' : 'secondary'}
                      sx={{ 
                        fontWeight: 600,
                        borderRadius: 2
                      }}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    mb: 2,
                    lineHeight: 1.6,
                    color: '#64748b'
                  }}>
                    {message.alt_text}
                  </Typography>

                  {message.tags.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      {message.tags.map((tag, index) => (
                        <Chip 
                          key={index} 
                          label={tag} 
                          size="small" 
                          sx={{ 
                            mr: 0.5, 
                            mb: 0.5,
                            borderRadius: 2,
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                            border: '1px solid #e2e8f0'
                          }} 
                        />
                      ))}
                    </Box>
                  )}

                  <Typography variant="caption" color="text.secondary" sx={{ 
                    color: '#94a3b8',
                    fontWeight: 500
                  }}>
                    Created: {message.usertimestamp || new Date(message.created_at || '').toLocaleDateString()}
                  </Typography>
                </CardContent>
                
                <CardActions sx={{ 
                  p: 2, 
                  pt: 0,
                  borderTop: '1px solid #f1f5f9',
                  backgroundColor: '#fafafa'
                }}>
                  <Button 
                    size="small" 
                    startIcon={<ViewIcon />} 
                    onClick={() => handlePreview(message)}
                    sx={{ 
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Preview
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<EditIcon />} 
                    onClick={() => handleEdit(message)}
                    sx={{ 
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Edit
                  </Button>
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => handleDelete(message._id!)}
                    sx={{ 
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: 'rgba(239, 68, 68, 0.1)'
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderBottom: '1px solid #e2e8f0',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              bgcolor: 'primary.main', 
              width: 40, 
              height: 40,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <SmartphoneIcon sx={{ fontSize: 20, color: 'white' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
              {editingMessage ? 'Edit Flex Message' : 'Create New Flex Message'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Template Selection Panel */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: '500px', overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom>
                  <ViewModuleIcon sx={{ mr: 1 }} />
                  Available Templates
                </Typography>
                
                {templateLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <List dense>
                    {availableTemplates.map((template) => (
                      <ListItem 
                        key={template._id}
                        button
                        selected={selectedTemplate?._id === template._id}
                        onClick={() => handleTemplateSelect(template)}
                        sx={{ 
                          border: selectedTemplate?._id === template._id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                          borderRadius: 1,
                          mb: 1
                        }}
                      >
                        <ListItemIcon>
                          {template.tags?.includes('video') ? <VideoLibraryIcon /> : <ViewModuleIcon />}
                        </ListItemIcon>
                        <ListItemText 
                          primary={template.name}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {template.purpose}
                              </Typography>
                              {template.tags && template.tags.length > 0 && (
                                <Box sx={{ mt: 0.5 }}>
                                  {template.tags.map((tag: string, index: number) => (
                                    <Chip 
                                      key={index} 
                                      label={tag} 
                                      size="small" 
                                      sx={{ mr: 0.5, mb: 0.5 }} 
                                    />
                                  ))}
                                </Box>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
                
                {availableTemplates.length === 0 && !templateLoading && (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No templates available
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Templates are flex messages marked with 'template' tag
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Form Fields */}
            <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                margin="normal"
              />
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Purpose</InputLabel>
                <Select
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  label="Purpose"
                >
                  <MenuItem value="liff_message">LIFF Message Send</MenuItem>
                  <MenuItem value="bot_reply">BOT Reply Message</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Alt Text"
                value={formData.alt_text}
                onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                margin="normal"
                  multiline
                rows={2}
                helperText="Text displayed when flex message cannot be rendered"
              />

              <TextField
                fullWidth
                label="Tags"
                value={formData.tags.join(', ')}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                })}
                margin="normal"
                helperText="Comma-separated tags"
              />

              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<BuildIcon />}
                  onClick={handleOpenDesigner}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Open Visual Designer
                </Button>
                <Typography variant="caption" color="text.secondary" display="block">
                  Use the visual designer to build your flex message with templates and components
                </Typography>
            </Box>

              <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Advanced: JSON Editor</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TextField
                    fullWidth
                    label="Flex Message JSON"
                    value={JSON.stringify(formData.flex_message, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setFormData({ ...formData, flex_message: parsed });
                      } catch (error) {
                        // Invalid JSON, don't update
                      }
                    }}
                    multiline
                    rows={8}
                    helperText="Advanced: Edit JSON directly (use with caution)"
                    sx={{ fontFamily: 'monospace' }}
                  />
                </AccordionDetails>
              </Accordion>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Live Preview
              </Typography>
              <VisualFlexMessagePreview flexMessage={formData.flex_message} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3,
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <Button 
            onClick={() => setDialogOpen(false)}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            {editingMessage ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog 
        open={previewDialogOpen} 
        onClose={() => setPreviewDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderBottom: '1px solid #e2e8f0',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                bgcolor: 'primary.main', 
                width: 40, 
                height: 40,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ViewIcon sx={{ fontSize: 20, color: 'white' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                Preview: {previewMessage?.name}
              </Typography>
            </Box>
            <Button 
              variant="outlined" 
              onClick={() => setPreviewDialogOpen(false)}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Close
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Tabs value={previewTabValue} onChange={(_, newValue) => setPreviewTabValue(newValue)}>
            <Tab label="Visual Preview" icon={<SmartphoneIcon />} />
            <Tab label="JSON Structure" icon={<CodeIcon />} />
          </Tabs>
          
          <Box sx={{ mt: 2 }}>
            {previewTabValue === 0 && previewMessage && (
              <VisualFlexMessagePreview flexMessage={previewMessage.flex_message} />
            )}
            {previewTabValue === 1 && previewMessage && (
              <TextField
                fullWidth
                multiline
                rows={15}
                value={JSON.stringify(previewMessage.flex_message, null, 2)}
                InputProps={{ readOnly: true }}
                sx={{ fontFamily: 'monospace' }}
              />
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Flex Message Designer */}
      <FlexMessageDesigner />

      {/* Element Editor */}
      {showElementEditor && editingElement && (
        <ElementEditor
          element={editingElement}
          onUpdate={(updates) => handleUpdateElement(editingElement.id, updates)}
          onDelete={() => handleDeleteElement(editingElement.id)}
          onClose={() => {
            setShowElementEditor(false);
            setEditingElement(null);
            setSelectedElement(null);
          }}
        />
      )}

      {/* File Upload Dialog */}
      <FileUploadDialog
        open={fileUploadDialog.open}
        fileType={fileUploadDialog.fileType}
        onSelect={fileUploadDialog.onSelect}
        onClose={() => setFileUploadDialog({ ...fileUploadDialog, open: false })}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FlexMessageManager;
