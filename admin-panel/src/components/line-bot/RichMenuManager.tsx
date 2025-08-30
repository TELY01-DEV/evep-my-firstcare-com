import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
  Chip,
  IconButton,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Menu,
  ListItemIcon
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Star,
  StarBorder,
  LinkOff,
  Assignment,
  Group,
  Image,
  Code,
  Palette,
  ViewModule,
  Refresh,
  Person,
  CloudUpload,
  ExpandMore,
  Lock,
  LockOpen,
  Close,
  Help,
  DragIndicator,
  Link,
  Visibility,
  Settings,
  Error as ErrorIcon
} from '@mui/icons-material';
import { getRichMenus, getRichMenuDetails, createRichMenu, uploadRichMenuImage, setDefaultRichMenu, assignRichMenuToUser, deleteRichMenu, changeRichMenuImage, validateRichMenu, autoCorrectRichMenu, getRichMenuAliases, deleteRichMenuAlias, createAliasesForRichMenu, fetchAndLinkAliases, getUnlinkedRichMenus, createRichMenuAlias, cleanupRichMenuAliases, updateRichMenuAlias } from '../../api';

interface RichMenu {
  richMenuId: string;
  name: string;
  chatBarText: string;
  size: { width: number; height: number };
  areas: Array<{
    bounds: { x: number; y: number; width: number; height: number };
    action: {
      type: string;
      data?: string;
      text?: string;
      uri?: string;
      richMenuAliasId?: string;
      label?: string;
    };
  }>;
  selected: boolean;
  isDefault: boolean;
  hasImage: boolean;
  createdAt: string;
  updatedAt: string;
  source: 'line_api' | 'database_only';
  // Database fields
  db_name?: string;
  db_created_at?: string;
  db_updated_at?: string;
  db_created_by?: string;
  db_status?: string;
  db_has_image?: boolean;
  db_is_default?: boolean;
}

interface RichMenuButton {
  id: string;
  bounds: { x: number; y: number; width: number; height: number };
  action: {
    type: 'postback' | 'message' | 'uri' | 'richmenuswitch';
    data?: string;
    text?: string;
    uri?: string;
    richMenuAliasId?: string;
  };
  label: string;
}

interface Hotspot {
  id: string;
  bounds: { x: number; y: number; width: number; height: number };
  action: {
    type: 'postback' | 'message' | 'uri' | 'richmenuswitch';
    data?: string;
    text?: string;
    uri?: string;
    richMenuAliasId?: string;
  };
  label: string;
  color: string;
}

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentHotspot: Hotspot | null;
  zoom: number;
  pan: { x: number; y: number };
  gridSnap: boolean;
  gridSize: number;
  showGrid: boolean;
  snapThreshold: number;
  isDragging: boolean;
  draggingHotspot: Hotspot | null;
  dragOffset: { x: number; y: number };
  isResizing: boolean;
  resizingHotspot: Hotspot | null;
  resizeHandle: 'nw' | 'ne' | 'sw' | 'se' | null;
  zoomLocked: boolean;
  lockedZoomLevel: number;
  mousePosition: { x: number; y: number } | null;
}

interface RichMenuTemplate {
  name: string;
  description: string;
  size: { width: number; height: number };
  areas: RichMenuButton[];
}

interface RichMenusResponse {
  success: boolean;
  rich_menus: RichMenu[];
  default_rich_menu_id: string | null;
  count: number;
  db_count: number;
  line_api_count: number;
  database_only_count: number;
}

interface RichMenuAlias {
  _id?: string;
  richMenuAliasId: string;
  richMenuId: string;
  name: string;
  status?: 'linked' | 'unlinked';
  created_at: string;
  updated_at: string;
}

interface RichMenuAliasesResponse {
  success: boolean;
  aliases: RichMenuAlias[];
}

// LINE Standard Rich Menu Sizes
const LINE_RICH_MENU_SIZES = {
  FULL: { width: 2500, height: 1686, label: 'Full Size (2500 x 1686)' },
  HALF: { width: 2500, height: 843, label: 'Half Size (2500 x 843)' }
};

const RichMenuManager: React.FC = () => {
  const [richMenus, setRichMenus] = useState<RichMenu[]>([]);
  const [richMenuAliases, setRichMenuAliases] = useState<RichMenuAlias[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  
  // Dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedRichMenu, setSelectedRichMenu] = useState<RichMenu | null>(null);
  const [userId, setUserId] = useState('');
  const [assigning, setAssigning] = useState(false);
  
  // Rich Menu Size Selection
  const [selectedRichMenuSize, setSelectedRichMenuSize] = useState<keyof typeof LINE_RICH_MENU_SIZES>('FULL');
  
  // Validate rich menu alias ID format
  const validateRichMenuAliasId = (aliasId: string): boolean => {
    if (!aliasId || aliasId.length === 0) return false;
    if (aliasId.length > 40) return false;
    // Only allow alphanumeric characters and hyphens
    return /^[a-zA-Z0-9-]+$/.test(aliasId);
  };
  
  // Handle rich menu size change
  const handleRichMenuSizeChange = (newSize: keyof typeof LINE_RICH_MENU_SIZES) => {
    setSelectedRichMenuSize(newSize);
    // If we have a background image, recalculate canvas dimensions
    if (backgroundImageFile && canvasImage) {
      const img = canvasImage;
      const canvas = canvasRef.current;
      if (canvas) {
        // Get the selected rich menu size
        const selectedSize = LINE_RICH_MENU_SIZES[newSize];
        const targetWidth = selectedSize.width;
        const targetHeight = selectedSize.height;
        const targetAspectRatio = targetWidth / targetHeight;
        
        // Calculate canvas dimensions to maintain the target aspect ratio
        const maxCanvasWidth = 800;
        const maxCanvasHeight = 600;
        
        let canvasWidth, canvasHeight;
        
        // Calculate canvas size to fit within max dimensions while maintaining target aspect ratio
        if (targetAspectRatio > maxCanvasWidth / maxCanvasHeight) {
          // Width is the limiting factor
          canvasWidth = maxCanvasWidth;
          canvasHeight = maxCanvasWidth / targetAspectRatio;
        } else {
          // Height is the limiting factor
          canvasHeight = maxCanvasHeight;
          canvasWidth = maxCanvasHeight * targetAspectRatio;
        }
        
        // Set canvas to calculated dimensions
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Calculate scale to fit image within canvas while maintaining aspect ratio
        const scaleX = canvasWidth / img.width;
        const scaleY = canvasHeight / img.height;
        const scale = Math.min(scaleX, scaleY);
        
        // Calculate the actual dimensions the image will be drawn at
        const drawnWidth = img.width * scale;
        const drawnHeight = img.height * scale;
        
        // Calculate centering offsets
        const offsetX = (canvasWidth - drawnWidth) / 2;
        const offsetY = (canvasHeight - drawnHeight) / 2;
        
        // Store all the positioning data for consistent use
        canvas.dataset.scale = scale.toString();
        canvas.dataset.drawnWidth = drawnWidth.toString();
        canvas.dataset.drawnHeight = drawnHeight.toString();
        canvas.dataset.offsetX = offsetX.toString();
        canvas.dataset.offsetY = offsetY.toString();
        canvas.dataset.imageWidth = img.width.toString();
        canvas.dataset.imageHeight = img.height.toString();
        
        console.log('Canvas updated for new rich menu size:', selectedSize.label);
        console.log('New canvas dimensions:', canvasWidth, 'x', canvasHeight);
        
        // Redraw the canvas
        scheduleCanvasRender();
      }
    }
  };
  
  // Create Alias Dialog State
  const [createAliasDialogOpen, setCreateAliasDialogOpen] = useState(false);
  const [unlinkedRichMenus, setUnlinkedRichMenus] = useState<any[]>([]);
  const [selectedUnlinkedRichMenu, setSelectedUnlinkedRichMenu] = useState<any>(null);
  const [aliasId, setAliasId] = useState('');
  const [creatingAlias, setCreatingAlias] = useState(false);
  
  // Update Alias Dialog State
  const [updateAliasDialogOpen, setUpdateAliasDialogOpen] = useState(false);
  const [selectedAliasForUpdate, setSelectedAliasForUpdate] = useState<any>(null);
  const [selectedRichMenuForUpdate, setSelectedRichMenuForUpdate] = useState<any>(null);
  const [updatingAlias, setUpdatingAlias] = useState(false);
  
  // Rich Menu Details Dialog State
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRichMenuForDetails, setSelectedRichMenuForDetails] = useState<any>(null);
  const [richMenuDetails, setRichMenuDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  
  // Create rich menu states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [richMenuForm, setRichMenuForm] = useState({
    name: '',
    chatBarText: 'Tap to open',
    displayByDefault: false,
    body: JSON.stringify({
      size: { width: 2500, height: 1686 },
      selected: false,
      name: "Rich Menu",
      chatBarText: "Tap to open",
      areas: [
        {
          bounds: { x: 0, y: 0, width: 2500, height: 1686 },
          action: { type: "postback", data: "action=menu&item=main" }
        }
      ]
    }, null, 2)
  });

  // Upload image states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedRichMenuForUpload, setSelectedRichMenuForUpload] = useState<RichMenu | null>(null);

  // Visual Builder State
  const [createMode, setCreateMode] = useState<'visual' | 'manual' | 'template' | 'import'>('visual');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('');
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);
  const [buttons, setButtons] = useState<RichMenuButton[]>([]);
  const [buttonDialogOpen, setButtonDialogOpen] = useState(false);
  const [editingButton, setEditingButton] = useState<RichMenuButton | null>(null);

  // Canvas Drawing State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentHotspot: null,
    zoom: 1,
    pan: { x: 0, y: 0 },
    gridSnap: false,
    gridSize: 100,
    showGrid: false,
    snapThreshold: 5,
    isDragging: false,
    draggingHotspot: null,
    dragOffset: { x: 0, y: 0 },
    isResizing: false,
    resizingHotspot: null,
    resizeHandle: null,
    zoomLocked: false,
    lockedZoomLevel: 1,
    mousePosition: null
  });
  const [hotspotDialogOpen, setHotspotDialogOpen] = useState(false);
  const [editingHotspot, setEditingHotspot] = useState<Hotspot | null>(null);
  const [canvasImage, setCanvasImage] = useState<HTMLImageElement | null>(null);
  const [animationFrameId, setAnimationFrameId] = useState<number | null>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [lastMouseMoveTime, setLastMouseMoveTime] = useState(0);
  const [throttleDelay] = useState(16); // ~60fps
  const [showDrawingControls, setShowDrawingControls] = useState(true);
  const [jsonImportText, setJsonImportText] = useState('');
  const [importedHotspots, setImportedHotspots] = useState<Hotspot[]>([]);
  const [showImportedHotspots, setShowImportedHotspots] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    hotspot: Hotspot | null;
  } | null>(null);
  const [highTransparency, setHighTransparency] = useState(true);

  // Rich Menu Templates
  const richMenuTemplates: RichMenuTemplate[] = [
    {
      name: "Home Menu (3x2 Grid)",
      description: "Standard 3x2 grid layout with 6 buttons",
      size: { width: 2500, height: 1686 },
      areas: [
        {
          id: "btn1",
          bounds: { x: 131, y: 127, width: 705, height: 713 },
          action: { type: "uri", uri: "https://example.com/button1" },
          label: "Button 1"
        },
        {
          id: "btn2",
          bounds: { x: 904, y: 127, width: 709, height: 718 },
          action: { type: "uri", uri: "https://example.com/button2" },
          label: "Button 2"
        },
        {
          id: "btn3",
          bounds: { x: 1672, y: 127, width: 735, height: 726 },
          action: { type: "richmenuswitch", data: "change-to-page-clip1", richMenuAliasId: "page-clip1" },
          label: "Switch Menu"
        },
        {
          id: "btn4",
          bounds: { x: 127, y: 874, width: 701, height: 701 },
          action: { type: "richmenuswitch", data: "change-to-page-dtx-book", richMenuAliasId: "page-dtx-book" },
          label: "DTX Book"
        },
        {
          id: "btn5",
          bounds: { x: 904, y: 874, width: 701, height: 697 },
          action: { type: "uri", uri: "https://example.com/button5" },
          label: "Button 5"
        },
        {
          id: "btn6",
          bounds: { x: 1681, y: 874, width: 709, height: 705 },
          action: { type: "uri", uri: "https://example.com/button6" },
          label: "Button 6"
        }
      ]
    },
    {
      name: "Simple Menu (2x2 Grid)",
      description: "Simple 2x2 grid layout with 4 buttons",
      size: { width: 2500, height: 1686 },
      areas: [
        {
          id: "btn1",
          bounds: { x: 200, y: 200, width: 1000, height: 600 },
          action: { type: "postback", data: "action=menu&item=1" },
          label: "Menu Item 1"
        },
        {
          id: "btn2",
          bounds: { x: 1300, y: 200, width: 1000, height: 600 },
          action: { type: "postback", data: "action=menu&item=2" },
          label: "Menu Item 2"
        },
        {
          id: "btn3",
          bounds: { x: 200, y: 900, width: 1000, height: 600 },
          action: { type: "postback", data: "action=menu&item=3" },
          label: "Menu Item 3"
        },
        {
          id: "btn4",
          bounds: { x: 1300, y: 900, width: 1000, height: 600 },
          action: { type: "postback", data: "action=menu&item=4" },
          label: "Menu Item 4"
        }
      ]
    },
    {
      name: "Single Button Menu",
      description: "Single large button covering most of the menu",
      size: { width: 2500, height: 1686 },
      areas: [
        {
          id: "main-btn",
          bounds: { x: 200, y: 200, width: 2100, height: 1286 },
          action: { type: "uri", uri: "https://example.com/main" },
          label: "Main Action"
        }
      ]
    }
  ];

  useEffect(() => {
    loadRichMenus();
    loadRichMenuAliases();
  }, []);

  // Effect to redraw canvas when hotspots or background image changes
  useEffect(() => {
    if (isCanvasReady && canvasImage) {
      scheduleCanvasRender();
    }
  }, [hotspots, backgroundImageUrl, drawingState.zoom, drawingState.pan, drawingState.showGrid, drawingState.currentHotspot]);

  // Cleanup effect for animation frames
  useEffect(() => {
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [animationFrameId]);

  // Handle wheel events with proper non-passive listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      // Check if zoom is locked
      if (drawingState.zoomLocked) {
        return;
      }
      
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.5, Math.min(3, drawingState.zoom * delta));
      
      setDrawingState(prev => ({
        ...prev,
        zoom: newZoom
      }));
      
      scheduleCanvasRender();
    };

    // Add event listener with non-passive option
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [drawingState.zoomLocked, drawingState.zoom]);

  const loadRichMenus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getRichMenus();
      const data: RichMenusResponse = response.data;
      
      if (data.success) {
        setRichMenus(data.rich_menus);
        setSuccess(`Loaded ${data.count} rich menus (${data.line_api_count} from LINE API, ${data.database_only_count} from database only)`);
      } else {
        setError('Failed to load rich menus');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load rich menus');
    } finally {
      setLoading(false);
    }
  };

  const loadRichMenuAliases = async () => {
    try {
      const response = await getRichMenuAliases();
      const data: RichMenuAliasesResponse = response.data;
      
      if (data.success) {
        setRichMenuAliases(data.aliases);
      }
    } catch (err: any) {
      console.error('Error loading rich menu aliases:', err);
    }
  };

  const handleFetchAndLinkAliases = async () => {
    try {
      setError(null);
      const response = await fetchAndLinkAliases();
      
      if (response.data.success) {
        const { aliases, line_aliases_count, created_count, updated_count } = response.data;
        
        let successMessage = `Synced ${line_aliases_count} aliases from LINE API\n`;
        successMessage += `• Created: ${created_count} new aliases\n`;
        successMessage += `• Updated: ${updated_count} existing aliases\n`;
        successMessage += `• Total in database: ${aliases.length} aliases`;
        
        if (aliases.length === 0) {
          successMessage += '\n\nNo rich menu aliases found in LINE API.';
        }
        
        setSuccess(successMessage);
        setRichMenuAliases(aliases); // Directly update the state with the aliases
      } else {
        setError(response.data.message || 'Failed to fetch and link aliases');
      }
    } catch (error: any) {
      console.error('Error fetching and linking aliases:', error);
      setError(error.response?.data?.detail || 'Failed to fetch and link aliases');
    }
  };

  const handleCleanupAliases = async () => {
    if (!window.confirm('Are you sure you want to clean up duplicate aliases? This will remove duplicate entries and keep only the linked ones.')) {
      return;
    }

    try {
      setError(null);
      const response = await cleanupRichMenuAliases();
      
      if (response.data.success) {
        setSuccess(response.data.message);
        loadRichMenuAliases(); // Refresh the aliases list
      } else {
        setError(response.data.message || 'Failed to cleanup aliases');
      }
    } catch (error: any) {
      console.error('Error cleaning up aliases:', error);
      setError(error.response?.data?.detail || 'Failed to cleanup aliases');
    }
  };

  const handleOpenCreateAliasDialog = async () => {
    try {
      setError(null);
      const response = await getUnlinkedRichMenus();
      
      if (response.data.success) {
        setUnlinkedRichMenus(response.data.unlinked_rich_menus);
        setCreateAliasDialogOpen(true);
      } else {
        setError(response.data.message || 'Failed to get unlinked rich menus');
      }
    } catch (error: any) {
      console.error('Error getting unlinked rich menus:', error);
      setError(error.response?.data?.detail || 'Failed to get unlinked rich menus');
    }
  };

  const handleCreateRichMenuAlias = async () => {
    if (!selectedUnlinkedRichMenu || !aliasId.trim()) {
      setError('Please select a rich menu and enter an alias ID');
      return;
    }

    try {
      setCreatingAlias(true);
      setError(null);
      
      const aliasData = {
        richMenuAliasId: aliasId.trim(),
        richMenuId: selectedUnlinkedRichMenu.rich_menu_id,
        name: `Alias for ${selectedUnlinkedRichMenu.name}`
      };
      
      const response = await createRichMenuAlias(aliasData);
      
      if (response.data.success) {
        setSuccess(`Alias "${aliasId}" created successfully for rich menu "${selectedUnlinkedRichMenu.name}"`);
        setCreateAliasDialogOpen(false);
        setSelectedUnlinkedRichMenu(null);
        setAliasId('');
        loadRichMenuAliases(); // Refresh the aliases list
      } else {
        setError(response.data.message || 'Failed to create alias');
      }
    } catch (error: any) {
      console.error('Error creating alias:', error);
      setError(error.response?.data?.detail || 'Failed to create alias');
    } finally {
      setCreatingAlias(false);
    }
  };

  const handleCreateAlias = async (richMenuId: string) => {
    try {
      const response = await createAliasesForRichMenu(richMenuId);
      if (response.data.success) {
        setSuccess(response.data.message);
        loadRichMenuAliases(); // Refresh aliases
      } else {
        setError('Failed to create aliases');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create aliases');
    }
  };

  const handleDeleteAlias = async (aliasId: string) => {
    if (!window.confirm(`Are you sure you want to delete the alias "${aliasId}"?`)) {
      return;
    }
    
    try {
      const response = await deleteRichMenuAlias(aliasId);
      if (response.data.success) {
        setSuccess(response.data.message);
        loadRichMenuAliases(); // Refresh aliases
      } else {
        setError('Failed to delete alias');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete alias');
    }
  };

  const handleOpenUpdateAliasDialog = (alias: any) => {
    setSelectedAliasForUpdate(alias);
    setSelectedRichMenuForUpdate(null);
    setUpdateAliasDialogOpen(true);
  };

  const handleUpdateAlias = async () => {
    if (!selectedAliasForUpdate || !selectedRichMenuForUpdate) {
      setError('Please select a rich menu to link to this alias');
      return;
    }

    try {
      setUpdatingAlias(true);
      setError(null);
      
      const updateData = {
        richMenuId: selectedRichMenuForUpdate.rich_menu_id
      };
      
      const response = await updateRichMenuAlias(selectedAliasForUpdate.richMenuAliasId, updateData);
      
      if (response.data.success) {
        setSuccess(`Alias "${selectedAliasForUpdate.richMenuAliasId}" updated successfully to point to "${selectedRichMenuForUpdate.name}"`);
        setUpdateAliasDialogOpen(false);
        setSelectedAliasForUpdate(null);
        setSelectedRichMenuForUpdate(null);
        loadRichMenuAliases(); // Refresh the aliases list
      } else {
        setError(response.data.message || 'Failed to update alias');
      }
    } catch (error: any) {
      console.error('Error updating alias:', error);
      setError(error.response?.data?.detail || 'Failed to update alias');
    } finally {
      setUpdatingAlias(false);
    }
  };

  const handleOpenDetailsDialog = async (richMenu: any) => {
    setSelectedRichMenuForDetails(richMenu);
    setRichMenuDetails(null);
    setImageLoaded(false);
    setImageDimensions({ width: 0, height: 0 });
    setDetailsDialogOpen(true);
    
    try {
      setLoadingDetails(true);
      setError(null);
      
      const response = await getRichMenuDetails(richMenu.richMenuId);
      
      if (response.data.success) {
        setRichMenuDetails(response.data);
      } else {
        setError(response.data.message || 'Failed to load rich menu details');
      }
    } catch (error: any) {
      console.error('Error loading rich menu details:', error);
      setError(error.response?.data?.detail || 'Failed to load rich menu details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.target as HTMLImageElement;
    setImageDimensions({
      width: img.offsetWidth,
      height: img.offsetHeight
    });
    setImageLoaded(true);
  };

  const handleSetDefault = async (richMenuId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await setDefaultRichMenu(richMenuId);
      
      if (response.data.success) {
        setRichMenus(prev => prev.map(menu => ({
          ...menu,
          isDefault: menu.richMenuId === richMenuId
        })));
        setSuccess(`Rich menu "${richMenus.find(m => m.richMenuId === richMenuId)?.name}" set as default`);
      } else {
        setError('Failed to set default rich menu');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to set default rich menu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRichMenu = async (richMenu: RichMenu) => {
    if (!window.confirm(`Are you sure you want to delete the rich menu "${richMenu.name}"?\n\nThis will delete it from both LINE API and the database.`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await deleteRichMenu(richMenu.richMenuId);
      
      if (response.data.success) {
        setRichMenus(prev => prev.filter(menu => menu.richMenuId !== richMenu.richMenuId));
        setSuccess(`Rich menu "${richMenu.name}" deleted successfully`);
      } else {
        setError('Failed to delete rich menu');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete rich menu');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToUser = async () => {
    if (!selectedRichMenu || !userId.trim()) {
      setError('Please enter a user ID');
      return;
    }

    try {
      setAssigning(true);
      setError(null);
      
      const response = await assignRichMenuToUser(selectedRichMenu.richMenuId, userId.trim());
      
      if (response.data.success) {
        setSuccess(`Rich menu "${selectedRichMenu.name}" assigned to user ${userId}`);
        setAssignDialogOpen(false);
        setUserId('');
        setSelectedRichMenu(null);
      } else {
        setError('Failed to assign rich menu to user');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to assign rich menu to user');
    } finally {
      setAssigning(false);
    }
  };



  const validateAndFixURIs = (richMenuData: any) => {
    if (richMenuData.areas && Array.isArray(richMenuData.areas)) {
      richMenuData.areas.forEach((area: any, index: number) => {
        if (area.action && area.action.type === 'uri' && area.action.uri) {
          // Fix URI if it doesn't have a protocol
          if (!area.action.uri.match(/^https?:\/\//)) {
            area.action.uri = `https://${area.action.uri}`;
            console.log(`Fixed URI for area ${index}: ${area.action.uri}`);
          }
        }
      });
    }
    return richMenuData;
  };

  const handleCreateRichMenu = async () => {
    if (!richMenuForm.name.trim()) {
      setError('Please enter a rich menu name');
      return;
    }

    if (richMenuForm.chatBarText.length > 14) {
      setError('Chat Bar Text must not exceed 14 characters (LINE API limit)');
      return;
    }

    if (!richMenuForm.body.trim()) {
      setError('Please enter the rich menu body JSON');
      return;
    }

    try {
      // Parse the JSON body
      let richMenuData = JSON.parse(richMenuForm.body);
      
      // Validate rich menu size against LINE standards
      if (richMenuData.size) {
        const richMenuSize = { width: richMenuData.size.width, height: richMenuData.size.height };
        const isValidSize = Object.values(LINE_RICH_MENU_SIZES).some(standardSize => 
          standardSize.width === richMenuSize.width && standardSize.height === richMenuSize.height
        );
        
        if (!isValidSize) {
          const allowedSizes = Object.values(LINE_RICH_MENU_SIZES).map(size => `${size.width} x ${size.height}`).join(' or ');
          setError(`❌ Invalid rich menu size! Only LINE standard sizes are allowed: ${allowedSizes}`);
          return;
        }
      }
      
      // Validate all richMenuAliasId values in the rich menu
      if (richMenuData.areas) {
        for (let i = 0; i < richMenuData.areas.length; i++) {
          const area = richMenuData.areas[i];
          if (area.action && area.action.type === 'richmenuswitch' && area.action.richMenuAliasId) {
            if (!validateRichMenuAliasId(area.action.richMenuAliasId)) {
              setError(`❌ Invalid rich menu alias ID in area ${i + 1}: "${area.action.richMenuAliasId}". Only alphanumeric characters and hyphens are allowed (1-40 characters).`);
              return;
            }
          }
        }
      }
      
      // Validate and fix URIs before sending to LINE API
      richMenuData = validateAndFixURIs(richMenuData);
      
      setCreating(true);
      setError(null);
      
      // Step 1: Validate rich menu object before creation
      const validationResponse = await validateRichMenu(richMenuData);
      
      if (!validationResponse.data.success) {
        setError(`Validation failed: ${validationResponse.data.message || 'Unknown validation error'}`);
        return;
      }
      
      // Step 2: Create rich menu after successful validation
      const response = await createRichMenu(richMenuData);
      
      if (response.data.success) {
        const richMenuId = response.data.rich_menu_id;
        const aliasesCreated = response.data.aliases_created || [];
        const aliasesSkipped = response.data.aliases_skipped || [];
        const aliasesFailed = response.data.aliases_failed || [];
        const aliasesLinked = response.data.aliases_linked || [];
        
        let successMessage = `Rich menu "${richMenuForm.name}" created successfully! ID: ${richMenuId}`;
        
        // Add alias information to success message
        if (aliasesCreated.length > 0) {
          successMessage += `\n\n✅ Auto-created ${aliasesCreated.length} aliases: ${aliasesCreated.join(', ')}`;
        }
        
        if (aliasesLinked.length > 0) {
          successMessage += `\n\n🔗 Auto-linked ${aliasesLinked.length} existing aliases: ${aliasesLinked.join(', ')}`;
        }
        
        if (aliasesSkipped.length > 0) {
          successMessage += `\n\n⚠️ Skipped ${aliasesSkipped.length} aliases: ${aliasesSkipped.join(', ')}`;
        }
        
        if (aliasesFailed.length > 0) {
          successMessage += `\n\n❌ Failed to create ${aliasesFailed.length} aliases: ${aliasesFailed.join(', ')}`;
        }
        
        setSuccess(successMessage);
        setCreateDialogOpen(false);
        resetCreateForm();
        loadRichMenus(); // Refresh the list
        loadRichMenuAliases(); // Refresh aliases
      } else {
        setError('Failed to create rich menu');
      }
    } catch (err: any) {
      if (err.message && err.message.includes('JSON')) {
        setError('Invalid JSON format in rich menu body');
      } else {
        setError(err.response?.data?.detail || 'Failed to create rich menu');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleUploadImage = async (richMenuId: string) => {
    if (!selectedFile) return;

    try {
      setUploadingImage(true);
      setError(null);
      
      // Check if rich menu already has an image
      const richMenu = richMenus.find(rm => rm.richMenuId === richMenuId);
      const hasExistingImage = richMenu?.hasImage || false;
      
      let response;
      if (hasExistingImage) {
        // Use change image endpoint (delete + create + upload)
        response = await changeRichMenuImage(richMenuId, selectedFile);
        if (response.data.success) {
          setSuccess(`Image changed successfully. New rich menu ID: ${response.data.new_rich_menu_id}`);
        } else {
          setError('Failed to change image');
        }
      } else {
        // Use upload image endpoint (simple upload)
        response = await uploadRichMenuImage(richMenuId, selectedFile);
        if (response.data.success) {
          setSuccess(`Image uploaded successfully for rich menu ${richMenuId}`);
        } else {
          setError('Failed to upload image');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload/change image');
    } finally {
      setUploadingImage(false);
    }
  };

  const resetCreateForm = () => {
    setRichMenuForm({
      name: '',
      chatBarText: 'Tap to open',
      displayByDefault: false,
      body: JSON.stringify({
        size: { width: 2500, height: 1686 },
        selected: false,
        name: "Rich Menu",
        chatBarText: "Tap to open",
        areas: [
          {
            bounds: { x: 0, y: 0, width: 2500, height: 1686 },
            action: { type: "postback", data: "action=menu&item=main" }
          }
        ]
      }, null, 2)
    });
    // Clear imported hotspots and related state
    setImportedHotspots([]);
    setShowImportedHotspots(false);
    setJsonImportText('');
    // Clear background image
    setBackgroundImageUrl('');
    setBackgroundImageFile(null);
  };

  // Visual Builder Helper Functions
  const generateRichMenuJSON = (name: string, buttons: RichMenuButton[], size: { width: number; height: number }) => {
    return {
      size,
      selected: richMenuForm.displayByDefault,
      name,
      chatBarText: richMenuForm.chatBarText,
      areas: buttons.map(btn => {
        // Ensure URI actions have proper protocol
        let action = { ...btn.action };
        if (action.type === 'uri' && action.uri && !action.uri.match(/^https?:\/\//)) {
          action.uri = `https://${action.uri}`;
        }
        
        return {
          bounds: btn.bounds,
          action: action
        };
      })
    };
  };

  const handleBackgroundImageUpload = (file: File) => {
    console.log('handleBackgroundImageUpload called with file:', file);
    console.log('File name:', file.name);
    console.log('File type:', file.type);
    console.log('File size:', file.size);
    
    const url = URL.createObjectURL(file);
    setBackgroundImageUrl(url);
    setBackgroundImageFile(file); // Store the actual file for later upload
    console.log('backgroundImageFile set to:', file);
    
    // Pre-load the image for smooth rendering
    const img = new window.Image();
    img.onload = () => {
      setCanvasImage(img);
      setIsCanvasReady(true);
      
      // Resize canvas to match selected LINE rich menu size ratio
      const canvas = canvasRef.current;
      if (canvas) {
        // Get the selected rich menu size
        const selectedSize = LINE_RICH_MENU_SIZES[selectedRichMenuSize];
        const targetWidth = selectedSize.width;
        const targetHeight = selectedSize.height;
        const targetAspectRatio = targetWidth / targetHeight;
        
        // Calculate canvas dimensions to maintain the target aspect ratio
        const maxCanvasWidth = 800;
        const maxCanvasHeight = 600;
        
        let canvasWidth, canvasHeight;
        
        // Calculate canvas size to fit within max dimensions while maintaining target aspect ratio
        if (targetAspectRatio > maxCanvasWidth / maxCanvasHeight) {
          // Width is the limiting factor
          canvasWidth = maxCanvasWidth;
          canvasHeight = maxCanvasWidth / targetAspectRatio;
        } else {
          // Height is the limiting factor
          canvasHeight = maxCanvasHeight;
          canvasWidth = maxCanvasHeight * targetAspectRatio;
        }
        
        // Set canvas to calculated dimensions
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Calculate scale to fit image within canvas while maintaining aspect ratio
        const scaleX = canvasWidth / img.width;
        const scaleY = canvasHeight / img.height;
        const scale = Math.min(scaleX, scaleY);
        
        // Calculate the actual dimensions the image will be drawn at
        const drawnWidth = img.width * scale;
        const drawnHeight = img.height * scale;
        
        // Calculate centering offsets
        const offsetX = (canvasWidth - drawnWidth) / 2;
        const offsetY = (canvasHeight - drawnHeight) / 2;
        
        // Store all the positioning data for consistent use
        canvas.dataset.scale = scale.toString();
        canvas.dataset.drawnWidth = drawnWidth.toString();
        canvas.dataset.drawnHeight = drawnHeight.toString();
        canvas.dataset.offsetX = offsetX.toString();
        canvas.dataset.offsetY = offsetY.toString();
        canvas.dataset.imageWidth = img.width.toString();
        canvas.dataset.imageHeight = img.height.toString();
        
        console.log('Selected rich menu size:', selectedSize.label, `(${targetWidth} x ${targetHeight})`);
        console.log('Target aspect ratio:', targetAspectRatio);
        console.log('Canvas dimensions:', canvasWidth, 'x', canvasHeight);
        console.log('Image dimensions:', img.width, 'x', img.height);
        console.log('Scale factor:', scale);
        console.log('Drawn image dimensions:', drawnWidth, 'x', drawnHeight);
        console.log('Centering offsets:', offsetX, offsetY);
        console.log('Perfect positioning check:', {
          scaleConsistent: Math.abs((drawnWidth / img.width) - (drawnHeight / img.height)) < 0.000001,
          imageFits: drawnWidth <= canvasWidth && drawnHeight <= canvasHeight,
          centered: offsetX >= 0 && offsetY >= 0
        });
      }
      
      // Cancel any pending animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      // Schedule initial render
      scheduleCanvasRender();
    };
    img.src = url;
  };

  const scheduleCanvasRender = () => {
    // Cancel any pending animation frame to prevent multiple renders
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    
    const frameId = requestAnimationFrame(() => {
      drawCanvas();
      setAnimationFrameId(null);
    });
    
    setAnimationFrameId(frameId);
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !canvasImage) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply zoom and pan transformations
    ctx.save();
    ctx.translate(drawingState.pan.x * drawingState.zoom, drawingState.pan.y * drawingState.zoom);
    ctx.scale(drawingState.zoom, drawingState.zoom);
    
    // Use the new positioning system stored in canvas dataset
    const scale = parseFloat(canvas.dataset.scale || '0');
    const drawnWidth = parseFloat(canvas.dataset.drawnWidth || '0');
    const drawnHeight = parseFloat(canvas.dataset.drawnHeight || '0');
    const offsetX = parseFloat(canvas.dataset.offsetX || '0');
    const offsetY = parseFloat(canvas.dataset.offsetY || '0');
    
    // Debug: Log the scaling calculations
    console.log('Canvas scaling (new system):', {
      canvasDimensions: { width: canvas.width, height: canvas.height },
      imageDimensions: { width: canvasImage.width, height: canvasImage.height },
      scale,
      drawnDimensions: { width: drawnWidth, height: drawnHeight },
      offset: { x: offsetX, y: offsetY },
      usingNewSystem: scale > 0 && drawnWidth > 0 && drawnHeight > 0
    });
    
    // Draw background image (cached)
    ctx.drawImage(canvasImage, offsetX, offsetY, drawnWidth, drawnHeight);
    
    // Draw grid
    drawGrid(ctx, canvas, scale, offsetX, offsetY);
    
    // Draw all hotspots
    hotspots.forEach(hotspot => {
      drawHotspot(ctx, hotspot, scale, offsetX, offsetY);
    });
    
    // Draw imported hotspots if enabled
    if (showImportedHotspots) {
      importedHotspots.forEach(hotspot => {
        drawHotspot(ctx, hotspot, scale, offsetX, offsetY, false);
      });
    }
    
    // Draw current drawing hotspot
    if (drawingState.currentHotspot) {
      drawHotspot(ctx, drawingState.currentHotspot, scale, offsetX, offsetY, true);
    }
    
    // Draw mouse position indicator (small crosshair)
    if (drawingState.mousePosition) {
      const mouseX = drawingState.mousePosition.x;
      const mouseY = drawingState.mousePosition.y;
      
      // Convert image coordinates to canvas coordinates
      const canvasX = offsetX + (mouseX * scale);
      const canvasY = offsetY + (mouseY * scale);
      
      // Draw crosshair
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      
      const size = 10;
      ctx.beginPath();
      ctx.moveTo(canvasX - size, canvasY);
      ctx.lineTo(canvasX + size, canvasY);
      ctx.moveTo(canvasX, canvasY - size);
      ctx.lineTo(canvasX, canvasY + size);
      ctx.stroke();
      
      // Draw coordinate text
      ctx.fillStyle = '#ff0000';
      ctx.font = '12px Arial';
      ctx.fillText(`(${Math.round(mouseX)}, ${Math.round(mouseY)})`, canvasX + 15, canvasY - 15);
    }
    
    ctx.restore();
  };

  const updateHotspotPosition = (hotspotId: string, newBounds: { x: number; y: number; width: number; height: number }) => {
    setHotspots(prevHotspots => 
      prevHotspots.map(h => 
        h.id === hotspotId ? { ...h, bounds: newBounds } : h
      )
    );
    
    // Schedule canvas render instead of immediate render
    scheduleCanvasRender();
  };

  const handleTemplateSelect = (template: RichMenuTemplate) => {
    setButtons(template.areas);
    setRichMenuForm({
      name: template.name,
      chatBarText: 'Tap to open',
      displayByDefault: false,
      body: JSON.stringify(generateRichMenuJSON(template.name, template.areas, template.size), null, 2)
    });
    setCreateMode('template');
  };

  const parseJsonToHotspots = (jsonText: string): Hotspot[] => {
    try {
      const jsonData = JSON.parse(jsonText);
      
      if (!jsonData.areas || !Array.isArray(jsonData.areas)) {
        throw new Error('Invalid JSON: missing or invalid areas array');
      }

      return jsonData.areas.map((area: any, index: number) => {
        if (!area.bounds || !area.action) {
          throw new Error(`Invalid area at index ${index}: missing bounds or action`);
        }

        const bounds = area.bounds;
        const action = area.action;

        // Generate a unique color for each hotspot (lighter for better transparency)
        const hue = (index * 137.5) % 360; // Golden angle for good color distribution
        const color = `hsl(${hue}, 60%, 70%)`;

        // Create a descriptive label based on action type
        let label = `Hotspot ${index + 1}`;
        if (action.type === 'uri') {
          label = `URI ${index + 1}`;
        } else if (action.type === 'postback') {
          label = `Postback ${index + 1}`;
        } else if (action.type === 'message') {
          label = `Message ${index + 1}`;
        } else if (action.type === 'richmenuswitch') {
          label = `Switch ${index + 1}`;
        }

        return {
          id: `imported_${index}`,
          bounds: {
            x: bounds.x || 0,
            y: bounds.y || 0,
            width: bounds.width || 100,
            height: bounds.height || 100
          },
          action: {
            type: action.type || 'postback',
            data: action.data || '',
            text: action.text || '',
            uri: action.uri || '',
            richMenuAliasId: action.richMenuAliasId || ''
          },
          label,
          color
        };
      });
    } catch (error) {
      console.error('Error parsing JSON:', error);
      throw error;
    }
  };

  const handleJsonImport = () => {
    try {
      const jsonData = JSON.parse(jsonImportText);
      
      // Validate rich menu size against LINE standards
      if (jsonData.size) {
        const richMenuSize = { width: jsonData.size.width, height: jsonData.size.height };
        const isValidSize = Object.values(LINE_RICH_MENU_SIZES).some(standardSize => 
          standardSize.width === richMenuSize.width && standardSize.height === richMenuSize.height
        );
        
        if (!isValidSize) {
          const allowedSizes = Object.values(LINE_RICH_MENU_SIZES).map(size => `${size.width} x ${size.height}`).join(' or ');
          setError(`❌ Invalid rich menu size! Only LINE standard sizes are allowed: ${allowedSizes}`);
          return;
        }
      }
      
      const hotspots = parseJsonToHotspots(jsonImportText);
      setImportedHotspots(hotspots);
      setShowImportedHotspots(true);
      
      // Auto-correct the JSON and update the form
      // Note: auto-correction would be handled by the backend API
      const correctedData = jsonData;
      
      setRichMenuForm({
        name: correctedData.name || 'Imported Rich Menu',
        chatBarText: correctedData.chatBarText || 'Tap to open',
        displayByDefault: correctedData.selected || false,
        body: JSON.stringify(correctedData, null, 2)
      });
      
      // Show success message
      setSuccess(`Successfully imported ${hotspots.length} hotspots!`);
    } catch (error) {
      setError(`Error importing JSON: ${error instanceof Error ? error.message : 'Invalid JSON format'}`);
    }
  };

  const clearImportedHotspots = () => {
    setImportedHotspots([]);
    setShowImportedHotspots(false);
    setJsonImportText('');
  };

  const handleContextMenu = (event: React.MouseEvent, hotspot: Hotspot) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      hotspot
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleDeleteHotspot = (hotspotId: string) => {
    // Remove from hotspots array
    setHotspots(prevHotspots => prevHotspots.filter(h => h.id !== hotspotId));
    
    // Remove from imported hotspots array
    setImportedHotspots(prevHotspots => prevHotspots.filter(h => h.id !== hotspotId));
    
    // Clear any active states
    setDrawingState(prev => ({
      ...prev,
      draggingHotspot: prev.draggingHotspot?.id === hotspotId ? null : prev.draggingHotspot,
      resizingHotspot: prev.resizingHotspot?.id === hotspotId ? null : prev.resizingHotspot
    }));
    
    handleCloseContextMenu();
    scheduleCanvasRender();
  };

  const handleMoveHotspot = (hotspotId: string) => {
    const hotspot = [...hotspots, ...importedHotspots].find(h => h.id === hotspotId);
    if (hotspot) {
      setDrawingState(prev => ({
        ...prev,
        isDragging: true,
        draggingHotspot: hotspot,
        dragOffset: { x: 0, y: 0 }
      }));
    }
    handleCloseContextMenu();
  };

  const getCursorStyle = (clientX: number, clientY: number): string => {
    if (!backgroundImageUrl) return 'default';
    
    const coords = getCanvasCoordinates(clientX, clientY);
    
    // Check if mouse is over a hotspot
    const hoveredHotspot = [...hotspots, ...(showImportedHotspots ? importedHotspots : [])].find(hotspot => 
      coords.x >= hotspot.bounds.x && 
      coords.x <= hotspot.bounds.x + hotspot.bounds.width &&
      coords.y >= hotspot.bounds.y && 
      coords.y <= hotspot.bounds.y + hotspot.bounds.height
    );
    
    if (hoveredHotspot) {
      // Check if mouse is over resize handles
      const handleSize = 8;
      const x = coords.x;
      const y = coords.y;
      
      if (x <= hoveredHotspot.bounds.x + handleSize && y <= hoveredHotspot.bounds.y + handleSize) {
        return 'nw-resize'; // Northwest handle
      } else if (x >= hoveredHotspot.bounds.x + hoveredHotspot.bounds.width - handleSize && y <= hoveredHotspot.bounds.y + handleSize) {
        return 'ne-resize'; // Northeast handle
      } else if (x <= hoveredHotspot.bounds.x + handleSize && y >= hoveredHotspot.bounds.y + hoveredHotspot.bounds.height - handleSize) {
        return 'sw-resize'; // Southwest handle
      } else if (x >= hoveredHotspot.bounds.x + hoveredHotspot.bounds.width - handleSize && y >= hoveredHotspot.bounds.y + hoveredHotspot.bounds.height - handleSize) {
        return 'se-resize'; // Southeast handle
      } else {
        return 'move'; // Dragging the hotspot
      }
    }
    
    // Default cursor based on drawing state
    if (drawingState.isDrawing) {
      return 'crosshair';
    } else if (drawingState.isDragging || drawingState.isResizing) {
      return 'grabbing';
    } else {
      return 'default';
    }
  };

  // Canvas Drawing Functions
  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasImage) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    // Convert mouse coordinates to canvas coordinates (accounting for CSS scaling)
    const canvasX = (clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (clientY - rect.top) * (canvas.height / rect.height);
    
    // Apply zoom and pan transformations (reverse of what's done in drawCanvas)
    const transformedX = (canvasX - drawingState.pan.x * drawingState.zoom) / drawingState.zoom;
    const transformedY = (canvasY - drawingState.pan.y * drawingState.zoom) / drawingState.zoom;
    
    // Use the new positioning system stored in canvas dataset
    const scale = parseFloat(canvas.dataset.scale || '0');
    const drawnWidth = parseFloat(canvas.dataset.drawnWidth || '0');
    const drawnHeight = parseFloat(canvas.dataset.drawnHeight || '0');
    const offsetX = parseFloat(canvas.dataset.offsetX || '0');
    const offsetY = parseFloat(canvas.dataset.offsetY || '0');
    const imageWidth = parseInt(canvas.dataset.imageWidth || '0');
    const imageHeight = parseInt(canvas.dataset.imageHeight || '0');
    
    if (scale > 0 && drawnWidth > 0 && drawnHeight > 0) {
      // Convert to image coordinates using the new positioning system
      const imageX = (transformedX - offsetX) / scale;
      const imageY = (transformedY - offsetY) / scale;
      
      // Ensure coordinates are within image bounds
      const clampedX = Math.max(0, Math.min(imageX, imageWidth));
      const clampedY = Math.max(0, Math.min(imageY, imageHeight));
      
      // Debug: Log the coordinate transformation (only when creating hotspots)
      if (drawingState.isDrawing) {
        console.log('Coordinate transformation (new system):', {
          clientCoords: { x: clientX, y: clientY },
          rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
          canvasCoords: { x: canvasX, y: canvasY },
          transformedCoords: { x: transformedX, y: transformedY },
          scale,
          drawnDimensions: { width: drawnWidth, height: drawnHeight },
          offset: { x: offsetX, y: offsetY },
          imageCoords: { x: imageX, y: imageY },
          clampedCoords: { x: clampedX, y: clampedY }
        });
      }
      
      return { x: clampedX, y: clampedY };
    } else {
      // Fallback to original calculation if new system is not available
      const imageScale = Math.min(
        canvas.width / canvasImage.width,
        canvas.height / canvasImage.height
      );
      
      const scaledWidth = Math.round(canvasImage.width * imageScale);
      const scaledHeight = Math.round(canvasImage.height * imageScale);
      const fallbackOffsetX = Math.round((canvas.width - scaledWidth) / 2);
      const fallbackOffsetY = Math.round((canvas.height - scaledHeight) / 2);
      
      const imageX = (transformedX - fallbackOffsetX) / imageScale;
      const imageY = (transformedY - fallbackOffsetY) / imageScale;
      
      const clampedX = Math.max(0, Math.min(imageX, canvasImage.width));
      const clampedY = Math.max(0, Math.min(imageY, canvasImage.height));
      
      return { x: clampedX, y: clampedY };
    }
  };

  const snapToGrid = (value: number, gridSize: number): number => {
    if (!drawingState.gridSnap) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  const snapCoordinates = (x: number, y: number) => {
    return {
      x: snapToGrid(x, drawingState.gridSize),
      y: snapToGrid(y, drawingState.gridSize)
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!backgroundImageUrl) return;
    
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    
    // Debug: Log coordinates for verification
    console.log('Mouse click coordinates:', {
      clientX: e.clientX,
      clientY: e.clientY,
      imageCoords: coords,
      canvasImage: canvasImage ? { width: canvasImage.width, height: canvasImage.height } : null,
      hotspots: hotspots.map(h => ({
        id: h.id,
        bounds: h.bounds,
        isInside: coords.x >= h.bounds.x && 
                 coords.x <= h.bounds.x + h.bounds.width &&
                 coords.y >= h.bounds.y && 
                 coords.y <= h.bounds.y + h.bounds.height
      }))
    });
    
    // Debug: Create a small hotspot at the exact click position to verify coordinates
    if (e.shiftKey) { // Hold Shift to create debug hotspot
      const debugHotspot: Hotspot = {
        id: `debug_${Date.now()}`,
        bounds: { 
          x: coords.x - 5, 
          y: coords.y - 5, 
          width: 10, 
          height: 10 
        },
        action: { type: 'postback', data: 'action=debug' },
        label: `Debug (${Math.round(coords.x)}, ${Math.round(coords.y)})`,
        color: '#ffff00'
      };
      setHotspots([...hotspots, debugHotspot]);
      drawCanvas();
      console.log('Created debug hotspot at:', coords);
      return;
    }
    
    // Check if clicking on existing hotspot for dragging/resizing
    const clickedHotspot = hotspots.find(hotspot => 
      coords.x >= hotspot.bounds.x && 
      coords.x <= hotspot.bounds.x + hotspot.bounds.width &&
      coords.y >= hotspot.bounds.y && 
      coords.y <= hotspot.bounds.y + hotspot.bounds.height
    );
    
    if (clickedHotspot) {
      // Check if clicking on resize handles
      const handleSize = 8;
      const hotspot = clickedHotspot;
      const x = coords.x;
      const y = coords.y;
      
      // Check corner handles
      if (x <= hotspot.bounds.x + handleSize && y <= hotspot.bounds.y + handleSize) {
        // Northwest handle
        setDrawingState({
          ...drawingState,
          isResizing: true,
          resizingHotspot: hotspot,
          resizeHandle: 'nw'
        });
      } else if (x >= hotspot.bounds.x + hotspot.bounds.width - handleSize && y <= hotspot.bounds.y + handleSize) {
        // Northeast handle
        setDrawingState({
          ...drawingState,
          isResizing: true,
          resizingHotspot: hotspot,
          resizeHandle: 'ne'
        });
      } else if (x <= hotspot.bounds.x + handleSize && y >= hotspot.bounds.y + hotspot.bounds.height - handleSize) {
        // Southwest handle
        setDrawingState({
          ...drawingState,
          isResizing: true,
          resizingHotspot: hotspot,
          resizeHandle: 'sw'
        });
      } else if (x >= hotspot.bounds.x + hotspot.bounds.width - handleSize && y >= hotspot.bounds.y + hotspot.bounds.height - handleSize) {
        // Southeast handle
        setDrawingState({
          ...drawingState,
          isResizing: true,
          resizingHotspot: hotspot,
          resizeHandle: 'se'
        });
      } else {
        // Dragging the hotspot
        const snappedCoords = snapCoordinates(coords.x, coords.y);
        setDrawingState({
          ...drawingState,
          isDragging: true,
          draggingHotspot: hotspot,
          dragOffset: {
            x: snappedCoords.x - hotspot.bounds.x,
            y: snappedCoords.y - hotspot.bounds.y
          }
        });
      }
      return;
    }
    
    // Start drawing new hotspot
    const snappedCoords = snapCoordinates(coords.x, coords.y);
    setDrawingState({
      ...drawingState,
      isDrawing: true,
      startX: snappedCoords.x,
      startY: snappedCoords.y,
      currentHotspot: null
    });
  };

  const throttledMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const now = Date.now();
    if (now - lastMouseMoveTime < throttleDelay) {
      return;
    }
    setLastMouseMoveTime(now);
    handleCanvasMouseMove(e);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!backgroundImageUrl) return;
    
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    
    // Update mouse position for visual indicator
    setDrawingState({
      ...drawingState,
      mousePosition: coords
    });
    
    // Handle resizing
    if (drawingState.isResizing && drawingState.resizingHotspot) {
      const hotspot = drawingState.resizingHotspot;
      const snappedCoords = snapCoordinates(coords.x, coords.y);
      
      let newBounds = { ...hotspot.bounds };
      
      switch (drawingState.resizeHandle) {
        case 'nw':
          newBounds.width = hotspot.bounds.x + hotspot.bounds.width - snappedCoords.x;
          newBounds.height = hotspot.bounds.y + hotspot.bounds.height - snappedCoords.y;
          newBounds.x = snappedCoords.x;
          newBounds.y = snappedCoords.y;
          break;
        case 'ne':
          newBounds.width = snappedCoords.x - hotspot.bounds.x;
          newBounds.height = hotspot.bounds.y + hotspot.bounds.height - snappedCoords.y;
          newBounds.y = snappedCoords.y;
          break;
        case 'sw':
          newBounds.width = hotspot.bounds.x + hotspot.bounds.width - snappedCoords.x;
          newBounds.height = snappedCoords.y - hotspot.bounds.y;
          newBounds.x = snappedCoords.x;
          break;
        case 'se':
          newBounds.width = snappedCoords.x - hotspot.bounds.x;
          newBounds.height = snappedCoords.y - hotspot.bounds.y;
          break;
      }
      
      // Ensure minimum size
      if (newBounds.width > 10 && newBounds.height > 10) {
        const updatedHotspot = { ...hotspot, bounds: newBounds };
        updateHotspotPosition(hotspot.id, newBounds);
        setDrawingState({
          ...drawingState,
          resizingHotspot: updatedHotspot
        });
      }
      return;
    }
    
    // Handle dragging
    if (drawingState.isDragging && drawingState.draggingHotspot) {
      const hotspot = drawingState.draggingHotspot;
      const snappedCoords = snapCoordinates(coords.x, coords.y);
      
      const newBounds = {
        x: snappedCoords.x - drawingState.dragOffset.x,
        y: snappedCoords.y - drawingState.dragOffset.y,
        width: hotspot.bounds.width,
        height: hotspot.bounds.height
      };
      
      const updatedHotspot = { ...hotspot, bounds: newBounds };
      updateHotspotPosition(hotspot.id, newBounds);
      setDrawingState({
        ...drawingState,
        draggingHotspot: updatedHotspot
      });
      return;
    }
    
    // Handle drawing new hotspot
    if (drawingState.isDrawing) {
      const snappedCoords = snapCoordinates(coords.x, coords.y);
      
      const width = Math.abs(snappedCoords.x - drawingState.startX);
      const height = Math.abs(snappedCoords.y - drawingState.startY);
      const x = Math.min(snappedCoords.x, drawingState.startX);
      const y = Math.min(snappedCoords.y, drawingState.startY);
      
      // Update the current drawing hotspot
      const currentHotspot: Hotspot = {
        id: 'drawing',
        bounds: { x, y, width, height },
        action: { type: 'postback', data: 'action=hotspot' },
        label: 'New Hotspot',
        color: '#ff0000'
      };
      
      setDrawingState({
        ...drawingState,
        currentHotspot
      });
      
      // Schedule canvas render for smooth drawing
      scheduleCanvasRender();
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!backgroundImageUrl) return;
    
    // Handle resizing completion
    if (drawingState.isResizing) {
      setDrawingState({
        ...drawingState,
        isResizing: false,
        resizingHotspot: null,
        resizeHandle: null
      });
      return;
    }
    
    // Handle dragging completion
    if (drawingState.isDragging) {
      setDrawingState({
        ...drawingState,
        isDragging: false,
        draggingHotspot: null,
        dragOffset: { x: 0, y: 0 }
      });
      return;
    }
    
    // Handle drawing completion
    if (drawingState.isDrawing) {
      const coords = getCanvasCoordinates(e.clientX, e.clientY);
      const snappedCoords = snapCoordinates(coords.x, coords.y);
      const width = Math.abs(snappedCoords.x - drawingState.startX);
      const height = Math.abs(snappedCoords.y - drawingState.startY);
      
      // Only create hotspot if it has minimum size
      if (width > 10 && height > 10) {
        const x = Math.min(snappedCoords.x, drawingState.startX);
        const y = Math.min(snappedCoords.y, drawingState.startY);
        
        // Debug: Log the hotspot being created
        console.log('Creating hotspot:', {
          x, y, width, height,
          imageWidth: canvasImage?.width,
          imageHeight: canvasImage?.height,
          bounds: { x, y, width, height }
        });
        
        const newHotspot: Hotspot = {
          id: `hotspot_${Date.now()}`,
          bounds: { x, y, width, height },
          action: { type: 'postback', data: 'action=hotspot' },
          label: `Hotspot ${hotspots.length + 1}`,
          color: `hsl(${Math.random() * 360}, 60%, 70%)`
        };
        
        setHotspots([...hotspots, newHotspot]);
        setEditingHotspot(newHotspot);
        setHotspotDialogOpen(true);
      }
      
      setDrawingState({
        ...drawingState,
        isDrawing: false,
        startX: 0,
        startY: 0,
        currentHotspot: null
      });
      
      drawCanvas();
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawingState.isDrawing || drawingState.isDragging || drawingState.isResizing) return;
    
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    
    // Check if clicking on existing hotspot (including imported hotspots)
    const clickedHotspot = [...hotspots, ...(showImportedHotspots ? importedHotspots : [])].find(hotspot => 
      coords.x >= hotspot.bounds.x && 
      coords.x <= hotspot.bounds.x + hotspot.bounds.width &&
      coords.y >= hotspot.bounds.y && 
      coords.y <= hotspot.bounds.y + hotspot.bounds.height
    );
    
    if (clickedHotspot) {
      setEditingHotspot(clickedHotspot);
      setHotspotDialogOpen(true);
    }
  };

  const handleCanvasContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!backgroundImageUrl) return;
    
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    
    // Find clicked hotspot (including imported hotspots)
    const clickedHotspot = [...hotspots, ...(showImportedHotspots ? importedHotspots : [])].find(hotspot => 
      coords.x >= hotspot.bounds.x && 
      coords.x <= hotspot.bounds.x + hotspot.bounds.width &&
      coords.y >= hotspot.bounds.y && 
      coords.y <= hotspot.bounds.y + hotspot.bounds.height
    );
    
    if (clickedHotspot) {
      handleContextMenu(e, clickedHotspot);
    }
  };

  const handleCanvasKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (e.key === 'g' || e.key === 'G') {
      setDrawingState({
        ...drawingState,
        showGrid: !drawingState.showGrid
      });
      drawCanvas();
    } else if (e.key === 's' || e.key === 'S') {
      setDrawingState({
        ...drawingState,
        gridSnap: !drawingState.gridSnap
      });
    } else if (e.key === '0') {
      setDrawingState({
        ...drawingState,
        zoom: 1,
        pan: { x: 0, y: 0 }
      });
      drawCanvas();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      // Delete selected hotspot
      if (editingHotspot) {
        handleHotspotDelete(editingHotspot.id);
      }
    }
  };



  const toggleZoomLock = () => {
    setDrawingState({
      ...drawingState,
      zoomLocked: !drawingState.zoomLocked,
      lockedZoomLevel: drawingState.zoomLocked ? drawingState.zoom : drawingState.lockedZoomLevel
    });
  };



  const drawGrid = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, scale: number, offsetX: number, offsetY: number) => {
    if (!drawingState.showGrid) return;
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    const gridSize = drawingState.gridSize * scale * drawingState.zoom;
    
    // Draw vertical lines
    for (let x = offsetX; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = offsetY; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
  };

  const drawHotspot = (
    ctx: CanvasRenderingContext2D, 
    hotspot: Hotspot, 
    scale: number, 
    offsetX: number, 
    offsetY: number,
    isDrawing: boolean = false
  ) => {
    // Since the canvas context is already transformed with zoom and pan in drawCanvas,
    // we need to work with the transformed coordinate system
    // The hotspot bounds are in image coordinates, so we convert them to the transformed canvas coordinates
    
    // Use the exact scale factor from canvas dataset for perfect coordinate mapping
    const canvas = ctx.canvas;
    const newScale = parseFloat(canvas.dataset.scale || '0');
    const drawnWidth = parseFloat(canvas.dataset.drawnWidth || '0');
    const drawnHeight = parseFloat(canvas.dataset.drawnHeight || '0');
    const newOffsetX = parseFloat(canvas.dataset.offsetX || '0');
    const newOffsetY = parseFloat(canvas.dataset.offsetY || '0');
    
    let finalScale, finalOffsetX, finalOffsetY;
    
    if (newScale > 0 && drawnWidth > 0 && drawnHeight > 0) {
      // Use new positioning system
      finalScale = newScale;
      finalOffsetX = newOffsetX;
      finalOffsetY = newOffsetY;
    } else {
      // Fallback to provided scale and offset
      finalScale = scale;
      finalOffsetX = offsetX;
      finalOffsetY = offsetY;
    }
    
    // Calculate the image bounds in the transformed coordinate system
    const imageBounds = {
      x: finalOffsetX,
      y: finalOffsetY,
      width: canvasImage!.width * finalScale,
      height: canvasImage!.height * finalScale
    };
    
    // Convert hotspot bounds from image coordinates to transformed canvas coordinates
    const x = imageBounds.x + (hotspot.bounds.x * finalScale);
    const y = imageBounds.y + (hotspot.bounds.y * finalScale);
    const width = hotspot.bounds.width * finalScale;
    const height = hotspot.bounds.height * finalScale;
    
    // Debug: Log the scaling calculations (only for drawing hotspots)
    if (isDrawing) {
      console.log('Drawing hotspot:', {
        hotspotId: hotspot.id,
        hotspotImageBounds: hotspot.bounds,
        originalScale: scale,
        originalOffset: { x: offsetX, y: offsetY },
        finalScale,
        finalOffset: { x: finalOffsetX, y: finalOffsetY },
        canvasCoords: { x, y, width, height },
        imageBounds: imageBounds,
        canvasDimensions: { width: ctx.canvas.width, height: ctx.canvas.height },
        imageDimensions: { width: canvasImage!.width, height: canvasImage!.height },
        usingNewSystem: newScale > 0
      });
    }
    
    // Check if this hotspot is being dragged or resized
    const isActive = (drawingState.draggingHotspot?.id === hotspot.id) || 
                    (drawingState.resizingHotspot?.id === hotspot.id);
    
    // Draw shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = isActive ? 8 : 4;
    ctx.shadowOffsetX = isActive ? 4 : 2;
    ctx.shadowOffsetY = isActive ? 4 : 2;
    
    // Draw rectangle with rounded corners
    const borderOpacity = highTransparency ? '50' : '80';
    ctx.strokeStyle = isActive ? '#ff6b35' : `${hotspot.color}${borderOpacity}`;
    ctx.lineWidth = isActive ? 4 : (isDrawing ? 3 : 2);
    ctx.setLineDash(isDrawing ? [5, 5] : []);
    
    // Draw rounded rectangle
    const radius = 8;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw fill with transparency based on user preference
    const fillOpacity = highTransparency ? (isActive ? '15' : '10') : (isActive ? '40' : '20');
    ctx.fillStyle = `${hotspot.color}${fillOpacity}`;
    ctx.fill();
    
    // Draw resize handles if not drawing
    if (!isDrawing) {
      const handleSize = 8;
      const handleColor = isActive ? '#ff6b35' : '#666';
      const borderColor = isActive ? '#fff' : '#333';
      
      ctx.fillStyle = handleColor;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      
      // Corner handles
      const handles = [
        { x: x, y: y }, // Northwest
        { x: x + width - handleSize, y: y }, // Northeast
        { x: x, y: y + height - handleSize }, // Southwest
        { x: x + width - handleSize, y: y + height - handleSize } // Southeast
      ];
      
      handles.forEach(handle => {
        // Draw handle with thicker border
        ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
        ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
        
        // Add inner highlight for better visibility
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(handle.x + 1, handle.y + 1, handleSize - 2, handleSize - 2);
      });
      
      // Draw border lines for resize areas (optional visual guide)
      if (isActive) {
        ctx.strokeStyle = 'rgba(255, 107, 53, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        
        // Draw diagonal lines from corners to show resize areas
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y + height);
        ctx.moveTo(x + width, y);
        ctx.lineTo(x, y + height);
        ctx.stroke();
        
        ctx.setLineDash([]);
      }
    }
    
    // Draw label with better styling
    ctx.fillStyle = '#000';
    ctx.font = `bold 12px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add text shadow for better readability
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    ctx.fillText(hotspot.label, x + width / 2, y + height / 2);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  };

  const handleHotspotSave = (hotspot: Hotspot) => {
    if (editingHotspot) {
      // Update the entire hotspot data, not just position
      setHotspots(prevHotspots => 
        prevHotspots.map(h => 
          h.id === hotspot.id ? hotspot : h
        )
      );
      // Also update imported hotspots if it's an imported one
      setImportedHotspots(prevImportedHotspots => 
        prevImportedHotspots.map(h => 
          h.id === hotspot.id ? hotspot : h
        )
      );
    } else {
      setHotspots([...hotspots, hotspot]);
    }
    setHotspotDialogOpen(false);
    setEditingHotspot(null);
    scheduleCanvasRender();
  };

  const handleHotspotDelete = (hotspotId: string) => {
    // Remove from both drawn and imported hotspots
    setHotspots(prevHotspots => prevHotspots.filter(h => h.id !== hotspotId));
    setImportedHotspots(prevImportedHotspots => prevImportedHotspots.filter(h => h.id !== hotspotId));
    setHotspotDialogOpen(false);
    setEditingHotspot(null);
    scheduleCanvasRender();
  };

  const convertHotspotsToButtons = () => {
    // Combine both drawn hotspots and imported hotspots
    const allHotspots = [...hotspots, ...(showImportedHotspots ? importedHotspots : [])];
    return allHotspots.map(hotspot => ({
      id: hotspot.id,
      bounds: hotspot.bounds,
      action: hotspot.action,
      label: hotspot.label
    }));
  };

  const handleCanvasCreate = async () => {
    console.log('handleCanvasCreate called');
    console.log('richMenuForm.name:', richMenuForm.name);
    console.log('hotspots.length:', hotspots.length);
    console.log('importedHotspots.length:', importedHotspots.length);
    console.log('showImportedHotspots:', showImportedHotspots);
    
    if (!richMenuForm.name.trim()) {
      console.log('Error: No rich menu name');
      setError('Please enter a rich menu name');
      return;
    }

    if (richMenuForm.chatBarText.length > 14) {
      console.log('Error: Chat Bar Text too long');
      setError('Chat Bar Text must not exceed 14 characters (LINE API limit)');
      return;
    }

    const totalHotspots = hotspots.length + (showImportedHotspots ? importedHotspots.length : 0);
    console.log('totalHotspots:', totalHotspots);
    
    if (totalHotspots === 0) {
      console.log('Error: No hotspots');
      setError('Please draw at least one hotspot or import hotspots from JSON');
      return;
    }

    try {
      console.log('Setting creating to true');
      setCreating(true);
      setError(null);

      const buttons = convertHotspotsToButtons();
      console.log('Converted buttons:', buttons);
      
      // Use the selected rich menu size
      const selectedSize = LINE_RICH_MENU_SIZES[selectedRichMenuSize];
      const richMenuData = generateRichMenuJSON(richMenuForm.name, buttons, { width: selectedSize.width, height: selectedSize.height });
      console.log('Generated rich menu data:', richMenuData);
      
      // Validate rich menu size against LINE standards
      const richMenuSize = { width: richMenuData.size.width, height: richMenuData.size.height };
      const isValidSize = Object.values(LINE_RICH_MENU_SIZES).some(standardSize => 
        standardSize.width === richMenuSize.width && standardSize.height === richMenuSize.height
      );
      
      if (!isValidSize) {
        const allowedSizes = Object.values(LINE_RICH_MENU_SIZES).map(size => `${size.width} x ${size.height}`).join(' or ');
        setError(`❌ Invalid rich menu size! Only LINE standard sizes are allowed: ${allowedSizes}`);
        return;
      }
      
      // Validate all richMenuAliasId values in the rich menu
      if (richMenuData.areas) {
        for (let i = 0; i < richMenuData.areas.length; i++) {
          const area = richMenuData.areas[i];
          if (area.action && area.action.type === 'richmenuswitch' && area.action.richMenuAliasId) {
            if (!validateRichMenuAliasId(area.action.richMenuAliasId)) {
              setError(`❌ Invalid rich menu alias ID in area ${i + 1}: "${area.action.richMenuAliasId}". Only alphanumeric characters and hyphens are allowed (1-40 characters).`);
              return;
            }
          }
        }
      }
      
      // Step 1: Validate rich menu object before creation
      console.log('Validating rich menu...');
      try {
        const validationResponse = await validateRichMenu(richMenuData);
        console.log('Validation response:', validationResponse);
        
        if (!validationResponse.data.success) {
          console.log('Validation failed:', validationResponse.data.message);
          setError(`Validation failed: ${validationResponse.data.message || 'Unknown validation error'}`);
          return;
        }
      } catch (validationErr: any) {
        console.log('Validation error:', validationErr);
        const errorMessage = validationErr.response?.data?.detail?.error?.message || 
                           validationErr.response?.data?.detail || 
                           'Validation failed';
        setError(`Validation failed: ${errorMessage}`);
        return;
      }
      
      // Step 2: Create rich menu after successful validation
      console.log('Creating rich menu...');
      const response = await createRichMenu(richMenuData);
      console.log('Create response:', response);
      
      if (response.data.success) {
        const richMenuId = response.data.rich_menu_id;
        const aliasesCreated = response.data.aliases_created || [];
        const aliasesSkipped = response.data.aliases_skipped || [];
        const aliasesFailed = response.data.aliases_failed || [];
        const aliasesLinked = response.data.aliases_linked || [];
        
        console.log('Rich menu created successfully:', richMenuId);
        console.log('Aliases created:', aliasesCreated);
        console.log('Aliases skipped:', aliasesSkipped);
        console.log('Aliases failed:', aliasesFailed);
        console.log('Aliases linked:', aliasesLinked);
        
        // Step 3: Upload the background image if available
        console.log('backgroundImageFile:', backgroundImageFile);
        console.log('backgroundImageFile type:', backgroundImageFile?.type);
        console.log('backgroundImageFile size:', backgroundImageFile?.size);
        
        let successMessage = `Rich menu "${richMenuForm.name}" created successfully! ID: ${richMenuId}`;
        
        // Add alias information to success message
        if (aliasesCreated.length > 0) {
          successMessage += `\n\n✅ Auto-created ${aliasesCreated.length} aliases: ${aliasesCreated.join(', ')}`;
        }
        
        if (aliasesLinked.length > 0) {
          successMessage += `\n\n🔗 Auto-linked ${aliasesLinked.length} existing aliases: ${aliasesLinked.join(', ')}`;
        }
        
        if (aliasesSkipped.length > 0) {
          successMessage += `\n\n⚠️ Skipped ${aliasesSkipped.length} aliases: ${aliasesSkipped.join(', ')}`;
        }
        
        if (aliasesFailed.length > 0) {
          successMessage += `\n\n❌ Failed to create ${aliasesFailed.length} aliases: ${aliasesFailed.join(', ')}`;
        }
        
        if (backgroundImageFile) {
          console.log('Uploading background image...');
          try {
            const uploadResponse = await uploadRichMenuImage(richMenuId, backgroundImageFile);
            if (uploadResponse.data.success) {
              console.log('Image uploaded successfully');
              setSuccess(`${successMessage}\n\n✅ Image uploaded successfully!`);
            } else {
              console.log('Image upload failed');
              setSuccess(`${successMessage}\n\n⚠️ Image upload failed`);
            }
          } catch (uploadErr: any) {
            console.log('Image upload error:', uploadErr);
            setSuccess(`${successMessage}\n\n⚠️ Image upload failed: ${uploadErr.response?.data?.detail || 'Unknown error'}`);
          }
        } else {
          console.log('No background image to upload');
          setSuccess(successMessage);
        }
        
        setCreateDialogOpen(false);
        resetCreateForm();
        setHotspots([]);
        setImportedHotspots([]);
        setShowImportedHotspots(false);
        setBackgroundImageUrl('');
        setBackgroundImageFile(null);
        loadRichMenus(); // Refresh the list
        loadRichMenuAliases(); // Refresh aliases
      } else {
        console.log('Failed to create rich menu');
        setError('Failed to create rich menu');
      }
    } catch (err: any) {
      console.log('Error in handleCanvasCreate:', err);
      setError(err.response?.data?.detail || 'Failed to create rich menu');
    } finally {
      console.log('Setting creating to false');
      setCreating(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };



  const openAssignDialog = (richMenu: RichMenu) => {
    setSelectedRichMenu(richMenu);
    setAssignDialogOpen(true);
  };

  const openUploadDialog = (richMenu: RichMenu) => {
    setSelectedRichMenuForUpload(richMenu);
    setUploadDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };



  if (loading && richMenus.length === 0) {
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
            <Group sx={{ fontSize: 28, color: 'white' }} />
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
              Rich Menu Management
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
              Manage LINE Rich Menus and navigation
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadRichMenus}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            disabled={loading}
          >
            Create Rich Menu
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Rich Menus Table */}
        <Grid item xs={12}>
          <Card sx={{ 
            background: 'white',
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Rich Menus Table ({richMenus.length})
              </Typography>
              
              {richMenus.length === 0 ? (
                <Alert severity="info">
                  No rich menus found. Create rich menus in LINE Developers Console first.
                </Alert>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Rich Menu ID</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Chat Bar Text</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Size</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Areas</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Image</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Default</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {richMenus.map((richMenu) => (
                          <TableRow key={richMenu.richMenuId} hover>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {richMenu.richMenuId}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {richMenu.name}
                                </Typography>
                                {richMenu.isDefault && (
                                  <Star sx={{ fontSize: '1rem', color: 'primary.main' }} />
                                )}
                                {richMenu.source === "database_only" && (
                                  <Chip 
                                    label="DB Only" 
                                    size="small" 
                                    color="warning" 
                                    variant="outlined"
                                    sx={{ fontSize: '0.6rem' }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                "{richMenu.chatBarText}"
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {richMenu.size.width}×{richMenu.size.height}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={richMenu.areas.length} 
                                size="small" 
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={richMenu.hasImage ? "Yes" : "No"} 
                                size="small" 
                                color={richMenu.hasImage ? "success" : "error"}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              {richMenu.isDefault ? (
                                <Chip 
                                  label="Default" 
                                  size="small" 
                                  color="primary"
                                  variant="filled"
                                  icon={<Star />}
                                />
                              ) : (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<StarBorder />}
                                  onClick={() => handleSetDefault(richMenu.richMenuId)}
                                  disabled={!richMenu.hasImage}
                                  color="warning"
                                  sx={{ minWidth: '100px', fontSize: '0.7rem' }}
                                >
                                  Set Default
                                </Button>
                              )}
                              {!richMenu.hasImage && !richMenu.isDefault && (
                                <Typography variant="caption" display="block" color="error.main" sx={{ mt: 0.5 }}>
                                  Upload image first
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" display="block">
                                {formatDate(richMenu.createdAt)}
                              </Typography>
                              {richMenu.db_created_at && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                  DB: {formatDate(richMenu.db_created_at)}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5, flexDirection: 'column' }}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<CloudUpload />}
                                  onClick={() => openUploadDialog(richMenu)}
                                  disabled={loading}
                                  sx={{ minWidth: '80px', fontSize: '0.7rem' }}
                                >
                                  {richMenu.hasImage ? "Change" : "Upload"}
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<Person />}
                                  onClick={() => openAssignDialog(richMenu)}
                                  disabled={loading}
                                  sx={{ minWidth: '80px', fontSize: '0.7rem' }}
                                >
                                  Assign
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<Delete />}
                                  onClick={() => handleDeleteRichMenu(richMenu)}
                                  disabled={loading}
                                  color="error"
                                  sx={{ minWidth: '80px', fontSize: '0.7rem' }}
                                >
                                  Delete
                                </Button>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Rich Menus Detailed List */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Rich Menus Details ({richMenus.length})
              </Typography>
              
              {richMenus.length === 0 ? (
                <Alert severity="info">
                  No rich menus found. Create rich menus in LINE Developers Console first.
                </Alert>
              ) : (
                <List>
                  {richMenus.map((richMenu, index) => (
                    <React.Fragment key={richMenu.richMenuId}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                {richMenu.name}
                              </Typography>
                              {richMenu.isDefault && (
                                <Chip 
                                  icon={<Star />} 
                                  label="Default" 
                                  color="primary" 
                                  size="small" 
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              {/* Rich Menu ID */}
                              <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                  Rich Menu ID:
                                </Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                  {richMenu.richMenuId}
                                </Typography>
                              </Box>

                              {/* Basic Info */}
                              <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    Chat Bar Text:
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    "{richMenu.chatBarText}"
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    Size:
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {richMenu.size.width} × {richMenu.size.height} pixels
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    Tap Areas:
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {richMenu.areas.length} areas configured
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    Status:
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Chip 
                                      label={richMenu.isDefault ? "Default" : "Set as Default"} 
                                      size="small" 
                                      color={richMenu.isDefault ? "primary" : "warning"}
                                      variant={richMenu.isDefault ? "filled" : "outlined"}
                                      onClick={richMenu.isDefault ? undefined : () => handleSetDefault(richMenu.richMenuId)}
                                      sx={richMenu.isDefault ? {} : { cursor: 'pointer' }}
                                      disabled={!richMenu.hasImage}
                                    />
                                    {!richMenu.hasImage && (
                                      <Chip 
                                        label="No Image" 
                                        size="small" 
                                        color="error" 
                                        variant="outlined"
                                      />
                                    )}
                                  </Box>
                                </Grid>
                              </Grid>

                              {/* Timestamps */}
                              <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                  Timestamps:
                                </Typography>
                                <Grid container spacing={1}>
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                      LINE Created:
                                    </Typography>
                                    <Typography variant="caption" display="block" color="text.secondary">
                                      {formatDate(richMenu.createdAt)}
                                    </Typography>
                                  </Grid>
                                  {richMenu.db_created_at && (
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                        DB Created:
                                      </Typography>
                                      <Typography variant="caption" display="block" color="text.secondary">
                                        {formatDate(richMenu.db_created_at)} by {richMenu.db_created_by || 'Unknown'}
                                      </Typography>
                                    </Grid>
                                  )}
                                  {richMenu.db_updated_at && (
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                        Last Updated:
                                      </Typography>
                                      <Typography variant="caption" display="block" color="text.secondary">
                                        {formatDate(richMenu.db_updated_at)}
                                      </Typography>
                                    </Grid>
                                  )}
                                </Grid>
                              </Box>

                              {/* JSON Body */}
                              <Box sx={{ mb: 2 }}>
                                <Accordion sx={{ boxShadow: 'none' }}>
                                  <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      JSON Body (LINE API Structure)
                                    </Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <Box sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                      <pre style={{ 
                                        fontSize: '0.75rem', 
                                        overflow: 'auto', 
                                        margin: 0,
                                        fontFamily: 'monospace',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word'
                                      }}>
{JSON.stringify({
  size: richMenu.size,
  selected: richMenu.selected,
  name: richMenu.name,
  chatBarText: richMenu.chatBarText,
  areas: richMenu.areas
}, null, 2)}
                                      </pre>
                                    </Box>
                                  </AccordionDetails>
                                </Accordion>
                              </Box>

                              {/* User Assignment */}
                              <Box sx={{ mb: 2, p: 1, bgcolor: 'blue.50', borderRadius: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                                  User Assignment:
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  This rich menu can be assigned to specific users or set as default for all users.
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  <Chip 
                                    label="Assign to User" 
                                    size="small" 
                                    color="info" 
                                    variant="outlined"
                                    onClick={() => openAssignDialog(richMenu)}
                                    sx={{ cursor: 'pointer' }}
                                  />
                                  {richMenu.isDefault ? (
                                    <Chip 
                                      label="Default" 
                                      size="small" 
                                      color="primary"
                                      variant="filled"
                                      icon={<Star />}
                                    />
                                  ) : (
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      startIcon={<StarBorder />}
                                      onClick={() => handleSetDefault(richMenu.richMenuId)}
                                      disabled={!richMenu.hasImage}
                                      color="warning"
                                      sx={{ minWidth: '120px', fontSize: '0.8rem' }}
                                    >
                                      Set as Default
                                    </Button>
                                  )}
                                </Box>
                              </Box>
                              
                              {/* Areas Details */}
                              <Accordion sx={{ mt: 1, boxShadow: 'none' }}>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                  <Typography variant="caption">
                                    View {richMenu.areas.length} tap areas
                                  </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <Grid container spacing={1}>
                                    {richMenu.areas.map((area, areaIndex) => (
                                      <Grid item xs={12} md={6} key={areaIndex}>
                                        <Box sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                            Area {areaIndex + 1}
                                          </Typography>
                                          <Typography variant="caption" display="block">
                                            Position: ({area.bounds.x}, {area.bounds.y}) 
                                            Size: {area.bounds.width}×{area.bounds.height}
                                          </Typography>
                                          <Typography variant="caption" display="block">
                                            Action: {area.action.type} - {area.action.label}
                                          </Typography>
                                          {area.action.uri && (
                                            <Typography variant="caption" display="block" sx={{ wordBreak: 'break-all' }}>
                                              URI: {area.action.uri}
                                            </Typography>
                                          )}
                                        </Box>
                                      </Grid>
                                    ))}
                                  </Grid>
                                </AccordionDetails>
                              </Accordion>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                            {/* Image Status */}
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                                Image Status:
                              </Typography>
                              <Chip 
                                label={richMenu.hasImage ? "Image Uploaded" : "No Image"} 
                                size="small" 
                                color={richMenu.hasImage ? "success" : "error"}
                                variant="outlined"
                              />
                            </Box>
                            
                            {/* Action Buttons */}
                            <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Visibility />}
                                onClick={() => handleOpenDetailsDialog(richMenu)}
                                disabled={loading}
                                sx={{ minWidth: '120px' }}
                              >
                                View Details
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<CloudUpload />}
                                onClick={() => openUploadDialog(richMenu)}
                                disabled={loading}
                                sx={{ minWidth: '120px' }}
                              >
                                {richMenu.hasImage ? "Change Image" : "Upload Image"}
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Person />}
                                onClick={() => openAssignDialog(richMenu)}
                                disabled={loading}
                                sx={{ minWidth: '120px' }}
                              >
                                Assign to User
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Link />}
                                onClick={() => handleCreateAlias(richMenu.richMenuId)}
                                disabled={loading}
                                sx={{ minWidth: '120px' }}
                                color="info"
                              >
                                Create Aliases
                              </Button>
                            </Box>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < richMenus.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Quick Actions
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="User ID to Unlink"
                    placeholder="Enter LINE User ID"
                    helperText="Remove custom rich menu assignment (user will see default)"
                  />
                  <Button
                    variant="outlined"
                    startIcon={<LinkOff />}
                    sx={{ mt: 1 }}
                    disabled={loading}
                  >
                    Unlink from User
                  </Button>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Rich Menu Management Tips:</strong>
                      <br />
                      • Create rich menus in LINE Developers Console
                      <br />
                      • Default rich menu is shown to all users
                      <br />
                      • Per-user rich menus override the default
                      <br />
                      • Rich menus can have up to 20 tap areas
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Rich Menu Aliases Management */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Rich Menu Aliases ({richMenuAliases.length})
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Rich Menu Aliases:</strong> These aliases enable switching between rich menus using the "richmenuswitch" action type. 
                  When you create a rich menu with "richmenuswitch" actions, you need to create corresponding aliases for the target rich menus.
                </Typography>
              </Alert>
              
              <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Badge Legend:
                </Typography>
                <Chip
                  label="LINE"
                  color="primary"
                  size="small"
                  variant="filled"
                  sx={{ fontSize: '0.7rem', height: 24 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Exists in LINE API
                </Typography>
                <Chip
                  label="Local"
                  color="secondary"
                  size="small"
                  variant="filled"
                  sx={{ fontSize: '0.7rem', height: 24 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Stored in database
                </Typography>
              </Box>

              <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Refresh />}
                  onClick={handleFetchAndLinkAliases}
                  sx={{ minWidth: 200 }}
                >
                  Sync from LINE API
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<Add />}
                  onClick={handleOpenCreateAliasDialog}
                  sx={{ minWidth: 200 }}
                >
                  Create Alias
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<Delete />}
                  onClick={handleCleanupAliases}
                  sx={{ minWidth: 200 }}
                >
                  Cleanup Duplicates
                </Button>
                <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center', ml: 1 }}>
                  Sync from LINE API, create new aliases, or cleanup duplicates
                </Typography>
              </Box>

              {richMenuAliases.length === 0 ? (
                <Alert severity="warning">
                  No rich menu aliases found. Aliases are automatically created when you use "Create Aliases" action on rich menus with "richmenuswitch" actions.
                </Alert>
              ) : (
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Alias ID</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Rich Menu ID</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {richMenuAliases.map((alias) => (
                        <TableRow key={alias.richMenuAliasId}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                {alias.richMenuAliasId}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {alias.status === 'linked' && (
                                  <Chip
                                    label="LINE"
                                    color="primary"
                                    size="small"
                                    variant="filled"
                                    sx={{ fontSize: '0.6rem', height: 20 }}
                                  />
                                )}
                                <Chip
                                  label="Local"
                                  color="secondary"
                                  size="small"
                                  variant="filled"
                                  sx={{ fontSize: '0.6rem', height: 20 }}
                                />
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                              {alias.richMenuId || 'Not linked'}
                            </Typography>
                          </TableCell>
                          <TableCell>{alias.name}</TableCell>
                          <TableCell>
                            <Chip
                              label={alias.status || 'linked'}
                              color={alias.status === 'unlinked' ? 'warning' : 'success'}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{formatDate(alias.created_at)}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                variant="outlined"
                                size="small"
                                color="primary"
                                startIcon={<Edit />}
                                onClick={() => handleOpenUpdateAliasDialog(alias)}
                              >
                                Update
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                color="error"
                                startIcon={<Delete />}
                                onClick={() => handleDeleteAlias(alias.richMenuAliasId)}
                              >
                                Delete
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

            {/* Rich Menu Details Dialog */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)} 
        maxWidth="xl" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '95vh',
            background: '#fafafa'
          }
        }}
      >
        {/* Header */}
        <Box sx={{ 
          background: '#1976d2', 
          color: 'white',
          p: 3,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Image sx={{ mr: 2, fontSize: 28 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Rich Menu Details
                </Typography>
                {selectedRichMenuForDetails && (
                  <Typography variant="subtitle1" sx={{ opacity: 0.9, fontWeight: 400 }}>
                    {selectedRichMenuForDetails.name}
                  </Typography>
                )}
              </Box>
            </Box>
            <IconButton 
              onClick={() => setDetailsDialogOpen(false)}
              sx={{ 
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                '&:hover': {
                  borderColor: 'white',
                  background: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <Close />
            </IconButton>
          </Box>
          
          {/* Quick Stats */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ 
                background: 'rgba(255,255,255,0.1)', 
                p: 2, 
                borderRadius: 2,
                textAlign: 'center'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Rich Menu ID
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontFamily: 'monospace', 
                  fontSize: '0.75rem',
                  wordBreak: 'break-all',
                  opacity: 0.9
                }}>
                  {richMenuDetails?.rich_menu?.richMenuId || 'Loading...'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ 
                background: 'rgba(255,255,255,0.1)', 
                p: 2, 
                borderRadius: 2,
                textAlign: 'center'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Size
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {richMenuDetails?.rich_menu?.size?.width || 0} × {richMenuDetails?.rich_menu?.size?.height || 0}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ 
                background: 'rgba(255,255,255,0.1)', 
                p: 2, 
                borderRadius: 2,
                textAlign: 'center'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Hotspots
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {richMenuDetails?.rich_menu?.areas?.length || 0}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        <DialogContent sx={{ p: 0, background: '#fafafa' }}>
          {loadingDetails ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              p: 8,
              minHeight: '500px'
            }}>
              <CircularProgress size={80} sx={{ mb: 3, color: '#1976d2' }} />
              <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
                Loading Rich Menu Details
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Fetching data from LINE API...
              </Typography>
            </Box>
          ) : richMenuDetails ? (
            <Box sx={{ p: 4 }}>
              {/* Main Content Grid */}
              <Grid container spacing={4}>
                {/* Left Column - Image and Basic Info */}
                <Grid item xs={12} lg={8}>
                  {/* Image Section */}
                  <Card sx={{ 
                    borderRadius: 3, 
                    overflow: 'hidden', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    mb: 4
                  }}>
                    <Box sx={{ 
                      p: 2.5, 
                      background: '#1976d2',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                        <Image sx={{ mr: 1.5 }} />
                        Rich Menu Image Preview
                      </Typography>
                      <Chip 
                        label={richMenuDetails.image ? 'Image Available' : 'No Image'} 
                        color={richMenuDetails.image ? 'success' : 'default'}
                        variant="filled"
                        size="small"
                      />
                    </Box>
                    
                                         {richMenuDetails.image ? (
                       <Box sx={{ 
                         position: 'relative',
                         background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                         minHeight: '500px',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         p: 3
                       }}>
                         <Box sx={{ 
                           position: 'relative',
                           borderRadius: 3,
                           overflow: 'hidden',
                           boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                           border: '3px solid white'
                         }}>
                           <img 
                             src={richMenuDetails.image} 
                             alt="Rich Menu" 
                             onLoad={handleImageLoad}
                             style={{ 
                               maxWidth: '100%', 
                               maxHeight: '600px',
                               objectFit: 'contain',
                               display: 'block'
                             }} 
                           />
                           
                           {/* Hotspot Overlays */}
                           {imageLoaded && richMenuDetails.rich_menu?.areas && richMenuDetails.rich_menu.areas.length > 0 && (
                             <Box sx={{ 
                               position: 'absolute', 
                               top: 0, 
                               left: 0, 
                               width: '100%', 
                               height: '100%',
                               pointerEvents: 'none'
                             }}>
                               {richMenuDetails.rich_menu.areas.map((area: any, index: number) => {
                                 // Calculate relative positions based on image size
                                 const imageWidth = richMenuDetails.rich_menu?.size?.width || 2500;
                                 const imageHeight = richMenuDetails.rich_menu?.size?.height || 1686;
                                 
                                 // Calculate scale factors
                                 const scaleX = imageDimensions.width / imageWidth;
                                 const scaleY = imageDimensions.height / imageHeight;
                                 
                                 // Calculate scaled positions and dimensions
                                 const scaledX = area.bounds.x * scaleX;
                                 const scaledY = area.bounds.y * scaleY;
                                 const scaledWidth = area.bounds.width * scaleX;
                                 const scaledHeight = area.bounds.height * scaleY;
                                 
                                 return (
                                   <Box
                                     key={index}
                                     sx={{
                                       position: 'absolute',
                                       left: `${scaledX}px`,
                                       top: `${scaledY}px`,
                                       width: `${scaledWidth}px`,
                                       height: `${scaledHeight}px`,
                                       border: '3px solid #ff4444',
                                       background: 'rgba(255, 68, 68, 0.2)',
                                       borderRadius: '4px',
                                       display: 'flex',
                                       alignItems: 'center',
                                       justifyContent: 'center',
                                       pointerEvents: 'none',
                                       zIndex: 10,
                                       transition: 'all 0.3s ease'
                                     }}
                                   >
                                     <Box sx={{
                                       position: 'absolute',
                                       top: '-25px',
                                       left: '50%',
                                       transform: 'translateX(-50%)',
                                       background: '#ff4444',
                                       color: 'white',
                                       padding: '2px 8px',
                                       borderRadius: '12px',
                                       fontSize: '12px',
                                       fontWeight: 'bold',
                                       whiteSpace: 'nowrap',
                                       zIndex: 11,
                                       boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                     }}>
                                       Hotspot {index + 1}
                                     </Box>
                                   </Box>
                                 );
                               })}
                             </Box>
                           )}
                         </Box>
                       </Box>
                    ) : (
                      <Box sx={{ 
                        p: 6, 
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                        minHeight: '500px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Box sx={{ 
                          width: 120, 
                          height: 120, 
                          borderRadius: '50%', 
                          background: 'rgba(25, 118, 210, 0.1)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          mb: 3
                        }}>
                          <Image sx={{ fontSize: 60, color: '#1976d2' }} />
                        </Box>
                        <Typography variant="h5" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                          No Image Available
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
                          This rich menu doesn't have an image uploaded. Images are required for rich menus to be displayed properly in LINE.
                        </Typography>
                      </Box>
                    )}
                  </Card>

                  {/* Hotspots Section */}
                  <Card sx={{ 
                    borderRadius: 3, 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}>
                    <Box sx={{ 
                      p: 2.5, 
                      background: '#1976d2',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                        <Code sx={{ mr: 1.5 }} />
                        Interactive Hotspots & Actions
                      </Typography>
                      <Chip 
                        label={`${richMenuDetails.rich_menu?.areas?.length || 0} Hotspots`} 
                        color="secondary"
                        variant="filled"
                        size="small"
                      />
                    </Box>
                    
                    <Box sx={{ p: 3 }}>
                      {richMenuDetails.rich_menu?.areas && richMenuDetails.rich_menu.areas.length > 0 ? (
                        <Grid container spacing={3}>
                          {richMenuDetails.rich_menu.areas.map((area: any, index: number) => (
                            <Grid item xs={12} md={6} key={index}>
                              <Card 
                                variant="outlined" 
                                sx={{ 
                                  borderRadius: 3,
                                  border: '2px solid #e3f2fd',
                                  background: '#fafafa',
                                  '&:hover': {
                                    borderColor: '#1976d2',
                                    boxShadow: '0 4px 20px rgba(25, 118, 210, 0.15)',
                                    transform: 'translateY(-2px)',
                                    transition: 'all 0.3s ease'
                                  },
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                <CardContent sx={{ p: 3 }}>
                                  {/* Hotspot Header */}
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    mb: 3,
                                    pb: 2,
                                    borderBottom: '2px solid #e3f2fd'
                                  }}>
                                    <Box sx={{ 
                                      width: 40, 
                                      height: 40, 
                                      borderRadius: '50%', 
                                      background: '#1976d2', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center',
                                      mr: 2,
                                      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)'
                                    }}>
                                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                                        {index + 1}
                                      </Typography>
                                    </Box>
                                    <Box>
                                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2' }}>
                                        Hotspot {index + 1}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Tap Area Configuration
                                      </Typography>
                                    </Box>
                                  </Box>
                                  
                                  {/* Position & Size */}
                                  <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                                      📍 Position & Dimensions
                                    </Typography>
                                    <Box sx={{ 
                                      background: '#e3f2fd', 
                                      p: 2, 
                                      borderRadius: 2,
                                      border: '1px solid #bbdefb'
                                    }}>
                                      <Typography variant="body2" sx={{ 
                                        fontFamily: 'monospace', 
                                        fontSize: '0.9rem',
                                        color: '#1976d2',
                                        fontWeight: 600
                                      }}>
                                        X: {area.bounds.x} | Y: {area.bounds.y}
                                      </Typography>
                                      <Typography variant="body2" sx={{ 
                                        fontFamily: 'monospace', 
                                        fontSize: '0.9rem',
                                        color: '#1976d2',
                                        fontWeight: 600
                                      }}>
                                        Width: {area.bounds.width} | Height: {area.bounds.height}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  
                                  {/* Action Type */}
                                  <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                                      ⚡ Action Type
                                    </Typography>
                                    <Chip 
                                      label={area.action.type.toUpperCase()} 
                                      size="medium" 
                                      color={
                                        area.action.type === 'postback' ? 'primary' :
                                        area.action.type === 'message' ? 'secondary' :
                                        area.action.type === 'uri' ? 'success' :
                                        area.action.type === 'richmenuswitch' ? 'warning' : 'default'
                                      }
                                      variant="filled"
                                      sx={{ 
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        height: 32
                                      }}
                                    />
                                  </Box>
                                  
                                  {/* Action Details */}
                                  {area.action.type === 'postback' && area.action.data && (
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                                        📤 Postback Data
                                      </Typography>
                                      <Box sx={{ 
                                        background: '#f5f5f5', 
                                        p: 2, 
                                        borderRadius: 2,
                                        border: '1px solid #e0e0e0'
                                      }}>
                                        <Typography variant="body2" sx={{ 
                                          fontFamily: 'monospace', 
                                          fontSize: '0.85rem',
                                          wordBreak: 'break-all',
                                          color: '#424242'
                                        }}>
                                          {area.action.data}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  )}
                                  
                                  {area.action.type === 'message' && area.action.text && (
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                                        💬 Message Text
                                      </Typography>
                                      <Box sx={{ 
                                        background: '#f5f5f5', 
                                        p: 2, 
                                        borderRadius: 2,
                                        border: '1px solid #e0e0e0'
                                      }}>
                                        <Typography variant="body2" sx={{ 
                                          color: '#424242',
                                          fontStyle: 'italic'
                                        }}>
                                          "{area.action.text}"
                                        </Typography>
                                      </Box>
                                    </Box>
                                  )}
                                  
                                  {area.action.type === 'uri' && area.action.uri && (
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                                        🔗 URI Link
                                      </Typography>
                                      <Box sx={{ 
                                        background: '#f5f5f5', 
                                        p: 2, 
                                        borderRadius: 2,
                                        border: '1px solid #e0e0e0'
                                      }}>
                                        <Typography variant="body2" sx={{ 
                                          fontFamily: 'monospace', 
                                          fontSize: '0.8rem',
                                          wordBreak: 'break-all',
                                          color: '#1976d2',
                                          textDecoration: 'underline'
                                        }}>
                                          {area.action.uri}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  )}
                                  
                                  {area.action.type === 'richmenuswitch' && area.action.richMenuAliasId && (
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                                        🔄 Target Rich Menu
                                      </Typography>
                                      <Box sx={{ 
                                        background: '#fff3e0', 
                                        p: 2, 
                                        borderRadius: 2,
                                        border: '1px solid #ffcc02'
                                      }}>
                                        <Typography variant="body2" sx={{ 
                                          fontFamily: 'monospace', 
                                          fontSize: '0.85rem',
                                          color: '#f57c00',
                                          fontWeight: 600
                                        }}>
                                          {area.action.richMenuAliasId}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  )}
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Box sx={{ 
                          p: 6, 
                          textAlign: 'center',
                          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                          borderRadius: 3
                        }}>
                          <Box sx={{ 
                            width: 100, 
                            height: 100, 
                            borderRadius: '50%', 
                            background: 'rgba(25, 118, 210, 0.1)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 3
                          }}>
                            <Code sx={{ fontSize: 50, color: '#1976d2' }} />
                          </Box>
                          <Typography variant="h5" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                            No Interactive Hotspots
                          </Typography>
                          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
                            This rich menu doesn't have any tap areas or actions configured. 
                            Hotspots allow users to interact with your rich menu by tapping on specific areas.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Card>
                </Grid>

                {/* Right Column - Information Panel */}
                <Grid item xs={12} lg={4}>
                  <Box sx={{ position: 'sticky', top: 20 }}>
                    {/* Rich Menu Information */}
                    <Card sx={{ 
                      borderRadius: 3, 
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      mb: 3
                    }}>
                      <Box sx={{ 
                        p: 2.5, 
                        background: '#1976d2',
                        color: 'white'
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                          <Settings sx={{ mr: 1.5 }} />
                          Rich Menu Properties
                        </Typography>
                      </Box>
                      <Box sx={{ p: 3 }}>
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                            📝 Name
                          </Typography>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 700, 
                            color: '#1976d2',
                            p: 2,
                            background: '#e3f2fd',
                            borderRadius: 2,
                            border: '1px solid #bbdefb'
                          }}>
                            {richMenuDetails.rich_menu?.name}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                            💬 Chat Bar Text
                          </Typography>
                          <Box sx={{ 
                            p: 2, 
                            background: '#f5f5f5', 
                            borderRadius: 2,
                            border: '1px solid #e0e0e0',
                            minHeight: 60,
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <Typography variant="body1" sx={{ 
                              color: '#424242',
                              fontStyle: 'italic',
                              textAlign: 'center',
                              width: '100%'
                            }}>
                              "{richMenuDetails.rich_menu?.chatBarText || 'No chat bar text configured'}"
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                            🎯 Default Status
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip 
                              label={richMenuDetails.rich_menu?.selected ? 'DEFAULT' : 'NOT DEFAULT'} 
                              color={richMenuDetails.rich_menu?.selected ? 'success' : 'default'}
                              variant="filled"
                              sx={{ 
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                height: 32
                              }}
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                              {richMenuDetails.rich_menu?.selected ? 'Auto-displays to all users' : 'Not set as default menu'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Card>

                    {/* Technical Details */}
                    <Card sx={{ 
                      borderRadius: 3, 
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }}>
                      <Box sx={{ 
                        p: 2.5, 
                        background: '#424242',
                        color: 'white'
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                          <Code sx={{ mr: 1.5 }} />
                          Technical Details
                        </Typography>
                      </Box>
                      <Box sx={{ p: 3 }}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Rich Menu ID
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontFamily: 'monospace', 
                            fontSize: '0.75rem',
                            background: '#f5f5f5',
                            p: 1.5,
                            borderRadius: 1,
                            border: '1px solid #e0e0e0',
                            wordBreak: 'break-all',
                            color: '#424242'
                          }}>
                            {richMenuDetails.rich_menu?.richMenuId}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Dimensions
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontFamily: 'monospace', 
                            fontSize: '0.9rem',
                            background: '#e3f2fd',
                            p: 1.5,
                            borderRadius: 1,
                            border: '1px solid #bbdefb',
                            color: '#1976d2',
                            fontWeight: 600
                          }}>
                            {richMenuDetails.rich_menu?.size?.width} × {richMenuDetails.rich_menu?.size?.height} px
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Hotspot Count
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontSize: '1.1rem',
                            background: '#e8f5e8',
                            p: 1.5,
                            borderRadius: 1,
                            border: '1px solid #c8e6c9',
                            color: '#2e7d32',
                            fontWeight: 600,
                            textAlign: 'center'
                          }}>
                            {richMenuDetails.rich_menu?.areas?.length || 0} Interactive Areas
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box sx={{ 
              p: 8, 
              textAlign: 'center',
              minHeight: '500px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
            }}>
              <Box sx={{ 
                width: 120, 
                height: 120, 
                borderRadius: '50%', 
                background: 'rgba(244, 67, 54, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mb: 3
              }}>
                <ErrorIcon sx={{ fontSize: 60, color: '#f44336' }} />
              </Box>
              <Typography variant="h4" color="error" sx={{ mb: 2, fontWeight: 700 }}>
                Failed to Load Details
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mb: 3 }}>
                Unable to fetch rich menu details from LINE API. Please check your connection and try again.
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => handleOpenDetailsDialog(selectedRichMenuForDetails)}
                startIcon={<Refresh />}
              >
                Retry Loading
              </Button>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 3, 
          borderTop: '2px solid #e3f2fd',
          background: '#fafafa',
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8
        }}>
          <Button 
            onClick={() => setDetailsDialogOpen(false)}
            variant="outlined"
            sx={{ 
              borderColor: '#1976d2',
              color: '#1976d2',
              '&:hover': {
                borderColor: '#1565c0',
                background: 'rgba(25, 118, 210, 0.04)'
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Alias Dialog */}
      <Dialog open={updateAliasDialogOpen} onClose={() => setUpdateAliasDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Update Rich Menu Alias
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Update Alias:</strong> Change which rich menu this alias points to. This will update both LINE API and your database.
            </Typography>
          </Alert>
          
          {selectedAliasForUpdate && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Current Alias: {selectedAliasForUpdate.richMenuAliasId}
              </Typography>
              
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Current Rich Menu:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedAliasForUpdate.richMenuId || 'Not linked'}
                </Typography>
              </Box>
            </Box>
          )}
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Select New Rich Menu ({richMenus.length} available)
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Rich Menu</InputLabel>
              <Select
                value={selectedRichMenuForUpdate?.rich_menu_id || ''}
                onChange={(e) => {
                  const selected = richMenus.find(rm => rm.richMenuId === e.target.value);
                  setSelectedRichMenuForUpdate(selected || null);
                }}
                label="Rich Menu"
              >
                {richMenus.map((richMenu) => (
                  <MenuItem key={richMenu.richMenuId} value={richMenu.richMenuId}>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {richMenu.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        {richMenu.richMenuId}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {selectedRichMenuForUpdate && (
            <Alert severity="success">
              <Typography variant="body2">
                <strong>Will Update:</strong> Alias "{selectedAliasForUpdate?.richMenuAliasId}" will point to "{selectedRichMenuForUpdate.name}"
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateAliasDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateAlias}
            variant="contained"
            disabled={!selectedRichMenuForUpdate || updatingAlias}
            startIcon={updatingAlias ? <CircularProgress size={16} /> : <Edit />}
          >
            {updatingAlias ? 'Updating...' : 'Update Alias'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Alias Dialog */}
      <Dialog open={createAliasDialogOpen} onClose={() => setCreateAliasDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Create Rich Menu Alias
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Rich Menu Aliases:</strong> Create aliases for rich menus to enable switching between them using the "richmenuswitch" action type. 
              Select a rich menu and provide an alias ID that will be used in richmenuswitch actions.
            </Typography>
          </Alert>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Select Rich Menu ({unlinkedRichMenus.length} available)
            </Typography>
            {unlinkedRichMenus.length === 0 ? (
              <Alert severity="warning">
                No unlinked rich menus found. All rich menus are already linked to aliases.
              </Alert>
            ) : (
              <FormControl fullWidth>
                <InputLabel>Rich Menu</InputLabel>
                <Select
                  value={selectedUnlinkedRichMenu?.rich_menu_id || ''}
                  onChange={(e) => {
                    const selected = unlinkedRichMenus.find(rm => rm.rich_menu_id === e.target.value);
                    setSelectedUnlinkedRichMenu(selected || null);
                    if (selected) {
                      setAliasId(selected.name); // Use rich menu name as default alias ID
                    }
                  }}
                  label="Rich Menu"
                >
                  {unlinkedRichMenus.map((richMenu) => (
                    <MenuItem key={richMenu.rich_menu_id} value={richMenu.rich_menu_id}>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {richMenu.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          {richMenu.rich_menu_id}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>

          {selectedUnlinkedRichMenu && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Alias Configuration
              </Typography>
              
              <TextField
                fullWidth
                label="Alias ID"
                value={aliasId}
                onChange={(e) => setAliasId(e.target.value)}
                placeholder="Enter alias ID (e.g., home-menu, dtx-book)"
                helperText={`This alias ID will be used in richmenuswitch actions. Will be normalized to: ${aliasId.toLowerCase()} (hyphens preserved, fallback to underscores if needed)`}
                sx={{ mb: 2 }}
              />
              
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Usage:</strong> Use this alias ID in richmenuswitch actions like: 
                  <code style={{ display: 'block', marginTop: 4, padding: 4, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                    {`{
  "type": "richmenuswitch",
  "richMenuAliasId": "${aliasId.toLowerCase() || 'your-alias-id'}"
}`}
                  </code>
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateAliasDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateRichMenuAlias}
            variant="contained"
            disabled={!selectedUnlinkedRichMenu || !aliasId.trim() || creatingAlias}
            startIcon={creatingAlias ? <CircularProgress size={16} /> : <Add />}
          >
            {creatingAlias ? 'Creating...' : 'Create Alias'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign to User Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assign Rich Menu to User
        </DialogTitle>
        <DialogContent>
          {selectedRichMenu && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Rich Menu: {selectedRichMenu.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ID: {selectedRichMenu.richMenuId}
              </Typography>
            </Box>
          )}
          
          <TextField
            fullWidth
            label="LINE User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="U1234567890abcdef..."
            helperText="Enter the LINE User ID to assign this rich menu"
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssignToUser}
            variant="contained"
            disabled={assigning || !userId.trim()}
            startIcon={assigning ? <CircularProgress size={16} /> : <Assignment />}
          >
            {assigning ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Rich Menu Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Create New Rich Menu</DialogTitle>
        <DialogContent>
          {createMode === 'visual' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Visual Builder Workflow:</strong>
                <br />
                1. Upload a background image first
                <br />
                2. Draw hotspots on the image
                <br />
                3. Create rich menu (image will be automatically uploaded)
              </Typography>
            </Alert>
          )}
          <Tabs value={createMode} onChange={(_, newValue) => setCreateMode(newValue)} sx={{ mb: 2 }}>
            <Tab label="Visual Builder" value="visual" icon={<Palette />} />
            <Tab label="Template" value="template" icon={<ViewModule />} />
            <Tab label="Manual JSON" value="manual" icon={<Code />} />
            <Tab label="Import JSON" value="import" icon={<CloudUpload />} />
          </Tabs>

          {createMode === 'visual' && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Rich Menu Name"
                  value={richMenuForm.name}
                  onChange={(e) => setRichMenuForm({...richMenuForm, name: e.target.value})}
                  placeholder="Enter rich menu name"
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Chat Bar Text"
                  value={richMenuForm.chatBarText}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 14) {
                      setRichMenuForm({...richMenuForm, chatBarText: value});
                    }
                  }}
                  placeholder="Text shown in chat bar when rich menu is active"
                  helperText={`${richMenuForm.chatBarText.length}/14 characters (LINE API limit) - This text appears in the chat input area when the rich menu is displayed`}
                  margin="normal"
                  inputProps={{ maxLength: 14 }}
                  error={richMenuForm.chatBarText.length > 14}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={richMenuForm.displayByDefault}
                      onChange={(e) => setRichMenuForm({...richMenuForm, displayByDefault: e.target.checked})}
                    />
                  }
                  label="Display by Default"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 0.5 }}>
                  When enabled, this rich menu will be displayed by default when users open the chat
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Rich Menu Size</InputLabel>
                  <Select
                    value={selectedRichMenuSize}
                    onChange={(e) => handleRichMenuSizeChange(e.target.value as keyof typeof LINE_RICH_MENU_SIZES)}
                    label="Rich Menu Size"
                  >
                    {Object.entries(LINE_RICH_MENU_SIZES).map(([key, size]) => (
                      <MenuItem key={key} value={key}>
                        {size.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Select the standard LINE rich menu size. The canvas will be scaled to match this ratio.
                  </Typography>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Background Image (Required for Drawing)</Typography>
                <input
                  accept="image/*"
                  type="file"
                  onChange={(e) => e.target.files?.[0] && handleBackgroundImageUpload(e.target.files[0])}
                  style={{ display: 'none' }}
                  id="background-image-upload"
                />
                <label htmlFor="background-image-upload">
                  <Button variant="contained" component="span" startIcon={<Image />}>
                    Upload Background Image
                  </Button>
                </label>
                {backgroundImageUrl && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    Background image uploaded successfully! You can now draw hotspots on the image.
                  </Alert>
                )}
              </Grid>

              {backgroundImageUrl && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Draw Hotspots on Image</Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Instructions:</strong>
                      <br />
                      • Click and drag on the image to draw hotspots
                      <br />
                      • Click on existing hotspots to edit them
                      <br />
                      • Each hotspot will become a touchable area in your rich menu
                    </Typography>
                  </Alert>
                  
                  <Box sx={{ 
                    border: '2px dashed #ccc', 
                    borderRadius: 2, 
                    p: 2, 
                    textAlign: 'center',
                    backgroundColor: '#f9f9f9',
                    position: 'relative'
                  }}>
                    {/* Drawing Controls Overlay */}
                    <Box sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      zIndex: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1
                    }}>
                      <Chip
                        label={`Zoom: ${Math.round(drawingState.zoom * 100)}%`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={drawingState.zoomLocked ? "🔒 Zoom Locked" : "🔓 Zoom Unlocked"}
                        size="small"
                        color={drawingState.zoomLocked ? "warning" : "default"}
                        variant="outlined"
                        onClick={toggleZoomLock}
                        sx={{ cursor: 'pointer' }}
                      />
                      <Chip
                        label={drawingState.gridSnap ? "Grid Snap: ON" : "Grid Snap: OFF"}
                        size="small"
                        color={drawingState.gridSnap ? "success" : "default"}
                        variant="outlined"
                        onClick={() => setDrawingState({
                          ...drawingState,
                          gridSnap: !drawingState.gridSnap
                        })}
                        sx={{ cursor: 'pointer' }}
                      />
                      <Chip
                        label={drawingState.showGrid ? "Grid: ON" : "Grid: OFF"}
                        size="small"
                        color={drawingState.showGrid ? "success" : "default"}
                        variant="outlined"
                        onClick={() => setDrawingState({
                          ...drawingState,
                          showGrid: !drawingState.showGrid
                        })}
                        sx={{ cursor: 'pointer' }}
                      />
                    </Box>

                    {/* Instructions Overlay */}
                    {showDrawingControls ? (
                      <Box sx={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        zIndex: 10,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: 1,
                        p: 1.5,
                        fontSize: '0.75rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        maxWidth: 250
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#333' }}>
                            Drawing Controls:
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => setShowDrawingControls(false)}
                            sx={{ 
                              p: 0.5, 
                              minWidth: 'auto',
                              color: '#666',
                              '&:hover': { color: '#333' }
                            }}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </Box>
                        <Typography variant="caption" display="block" sx={{ color: '#555', mb: 0.5 }}>
                          • Click & drag to draw hotspots
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ color: '#555', mb: 0.5 }}>
                          • Drag hotspots to move them
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ color: '#555', mb: 0.5 }}>
                          • Drag corner handles to resize
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ color: '#555', mb: 0.5 }}>
                          • Mouse wheel to zoom
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ color: '#555', mb: 0.5 }}>
                          • Lock zoom to prevent accidental changes
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ color: '#555', mb: 0.5 }}>
                          • Press 'G' to toggle grid
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ color: '#555', mb: 0.5 }}>
                          • Press 'S' to toggle snap
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ color: '#555', mb: 0.5 }}>
                          • Press '0' to reset view
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ color: '#555' }}>
                          • Press 'Delete' to remove hotspot
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        zIndex: 10
                      }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setShowDrawingControls(true)}
                          startIcon={<Help />}
                          sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderColor: 'rgba(0, 0, 0, 0.2)',
                            color: '#666',
                            fontSize: '0.75rem',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 1)',
                              borderColor: 'rgba(0, 0, 0, 0.3)',
                              color: '#333'
                            }
                          }}
                        >
                          Show Help
                        </Button>
                      </Box>
                    )}

                    <canvas
                      ref={canvasRef}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={(e) => {
                        throttledMouseMove(e);
                        // Update cursor style
                        const canvas = canvasRef.current;
                        if (canvas) {
                          canvas.style.cursor = getCursorStyle(e.clientX, e.clientY);
                        }
                      }}
                      onMouseUp={handleCanvasMouseUp}
                      onClick={handleCanvasClick}
                      onContextMenu={handleCanvasContextMenu}
                      onKeyDown={handleCanvasKeyDown}
                      onMouseLeave={() => {
                        // Reset cursor when leaving canvas
                        const canvas = canvasRef.current;
                        if (canvas) {
                          canvas.style.cursor = 'default';
                        }
                        // Clear mouse position
                        setDrawingState({
                          ...drawingState,
                          mousePosition: null
                        });
                      }}
                      tabIndex={0}
                      style={{
                        width: '100%',
                        maxWidth: '800px',
                        height: 'auto',
                        cursor: 'default',
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        userSelect: 'none',
                        touchAction: 'none'
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => {
                        setHotspots([]);
                        setImportedHotspots([]);
                        drawCanvas();
                      }}
                      startIcon={<Delete />}
                    >
                      Clear All Hotspots
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => {
                        // Create test hotspots that cover the entire image
                        if (canvasImage) {
                          const testHotspots: Hotspot[] = [
                            {
                              id: 'test_1',
                              bounds: { x: 0, y: 0, width: canvasImage.width / 3, height: canvasImage.height / 2 },
                              action: { type: 'postback', data: 'action=test1' },
                              label: 'Test 1',
                              color: '#ff0000'
                            },
                            {
                              id: 'test_2',
                              bounds: { x: canvasImage.width / 3, y: 0, width: canvasImage.width / 3, height: canvasImage.height / 2 },
                              action: { type: 'postback', data: 'action=test2' },
                              label: 'Test 2',
                              color: '#00ff00'
                            },
                            {
                              id: 'test_3',
                              bounds: { x: (canvasImage.width / 3) * 2, y: 0, width: canvasImage.width / 3, height: canvasImage.height / 2 },
                              action: { type: 'postback', data: 'action=test3' },
                              label: 'Test 3',
                              color: '#0000ff'
                            }
                          ];
                          setHotspots(testHotspots);
                          drawCanvas();
                        }
                      }}
                      startIcon={<Add />}
                    >
                      Add Test Hotspots
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={drawCanvas}
                      startIcon={<Refresh />}
                    >
                      Refresh Canvas
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => {
                        if (canvasImage) {
                          // Create a test hotspot at the center of the image
                          const centerX = canvasImage.width / 2;
                          const centerY = canvasImage.height / 2;
                          const testHotspot: Hotspot = {
                            id: 'test_center',
                            bounds: { 
                              x: centerX - 50, 
                              y: centerY - 50, 
                              width: 100, 
                              height: 100 
                            },
                            action: { type: 'postback', data: 'action=test_center' },
                            label: 'Center Test',
                            color: '#ff0000'
                          };
                          setHotspots([testHotspot]);
                          drawCanvas();
                          console.log('Created center test hotspot:', testHotspot);
                        }
                      }}
                      startIcon={<Add />}
                    >
                      Test Center Hotspot
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => {
                        if (canvasImage) {
                          // Create test hotspots at known positions to verify coordinate transformation
                          const testHotspots: Hotspot[] = [
                            {
                              id: 'test_top_left',
                              bounds: { x: 0, y: 0, width: 100, height: 100 },
                              action: { type: 'postback', data: 'action=top_left' },
                              label: 'Top Left',
                              color: '#ff0000'
                            },
                            {
                              id: 'test_top_right',
                              bounds: { x: canvasImage.width - 100, y: 0, width: 100, height: 100 },
                              action: { type: 'postback', data: 'action=top_right' },
                              label: 'Top Right',
                              color: '#00ff00'
                            },
                            {
                              id: 'test_bottom_left',
                              bounds: { x: 0, y: canvasImage.height - 100, width: 100, height: 100 },
                              action: { type: 'postback', data: 'action=bottom_left' },
                              label: 'Bottom Left',
                              color: '#0000ff'
                            },
                            {
                              id: 'test_bottom_right',
                              bounds: { x: canvasImage.width - 100, y: canvasImage.height - 100, width: 100, height: 100 },
                              action: { type: 'postback', data: 'action=bottom_right' },
                              label: 'Bottom Right',
                              color: '#ffff00'
                            }
                          ];
                          setHotspots(testHotspots);
                          drawCanvas();
                          console.log('Created corner test hotspots:', testHotspots);
                        }
                      }}
                      startIcon={<Add />}
                    >
                      Test Corner Hotspots
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => setDrawingState({
                        ...drawingState,
                        zoom: 1,
                        pan: { x: 0, y: 0 }
                      })}
                    >
                      Reset View
                    </Button>
                    <Button 
                      variant={drawingState.zoomLocked ? "contained" : "outlined"}
                      size="small"
                      color={drawingState.zoomLocked ? "warning" : "primary"}
                      onClick={toggleZoomLock}
                      startIcon={drawingState.zoomLocked ? <Lock /> : <LockOpen />}
                    >
                      {drawingState.zoomLocked ? "Unlock Zoom" : "Lock Zoom"}
                    </Button>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Grid Size</InputLabel>
                      <Select
                        value={drawingState.gridSize}
                        onChange={(e) => setDrawingState({
                          ...drawingState,
                          gridSize: e.target.value as number
                        })}
                        label="Grid Size"
                      >
                        <MenuItem value={50}>50px</MenuItem>
                        <MenuItem value={100}>100px</MenuItem>
                        <MenuItem value={200}>200px</MenuItem>
                        <MenuItem value={500}>500px</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={drawingState.gridSnap}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDrawingState({
                            ...drawingState,
                            gridSnap: e.target.checked
                          })}
                          size="small"
                        />
                      }
                      label="Grid Snap"
                      sx={{ ml: 1 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={drawingState.showGrid}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDrawingState({
                            ...drawingState,
                            showGrid: e.target.checked
                          })}
                          size="small"
                        />
                      }
                      label="Show Grid"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={drawingState.zoomLocked}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDrawingState({
                            ...drawingState,
                            zoomLocked: e.target.checked
                          })}
                          size="small"
                        />
                      }
                      label="Lock Zoom"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={highTransparency}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setHighTransparency(e.target.checked);
                            scheduleCanvasRender();
                          }}
                          size="small"
                        />
                      }
                      label="High Transparency"
                    />
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Hotspots ({hotspots.length})</Typography>
                </Box>
                
                {hotspots.length === 0 ? (
                  <Alert severity="info">
                    {backgroundImageUrl 
                      ? "No hotspots drawn yet. Click and drag on the image above to create hotspots."
                      : "Upload a background image first to start drawing hotspots."
                    }
                  </Alert>
                ) : (
                  <Grid container spacing={1}>
                    {hotspots.map((hotspot) => (
                      <Grid item xs={12} sm={6} md={4} key={hotspot.id}>
                        <Card>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Box 
                                sx={{ 
                                  width: 16, 
                                  height: 16, 
                                  backgroundColor: hotspot.color, 
                                  borderRadius: 1,
                                  mr: 1
                                }} 
                              />
                              <Typography variant="subtitle2">{hotspot.label}</Typography>
                            </Box>
                            <Typography variant="caption" color="textSecondary">
                              {hotspot.action.type} - {Math.round(hotspot.bounds.width)}x{Math.round(hotspot.bounds.height)}
                              {hotspot.action.data && ` | Data: ${hotspot.action.data.substring(0, 20)}${hotspot.action.data.length > 20 ? '...' : ''}`}
                              {hotspot.action.text && ` | Text: ${hotspot.action.text.substring(0, 20)}${hotspot.action.text.length > 20 ? '...' : ''}`}
                              {hotspot.action.uri && ` | URI: ${hotspot.action.uri.substring(0, 20)}${hotspot.action.uri.length > 20 ? '...' : ''}`}
                            </Typography>
                          </CardContent>
                          <CardActions>
                            <IconButton size="small" onClick={() => {
                              setEditingHotspot(hotspot);
                              setHotspotDialogOpen(true);
                            }}>
                              <Edit />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleHotspotDelete(hotspot.id)}>
                              <Delete />
                            </IconButton>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="error"
                              onClick={() => handleHotspotDelete(hotspot.id)}
                              sx={{ ml: 'auto' }}
                            >
                              Delete
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Grid>
            </Grid>
          )}

          {createMode === 'template' && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Select a Template</Typography>
                <Grid container spacing={2}>
                  {richMenuTemplates.map((template) => (
                    <Grid item xs={12} md={4} key={template.name}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6">{template.name}</Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            {template.description}
                          </Typography>
                          <Typography variant="caption">
                            Size: {template.size.width}x{template.size.height} | Buttons: {template.areas.length}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            variant="contained"
                            onClick={() => handleTemplateSelect(template)}
                          >
                            Use Template
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
              
              {buttons.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Template Preview</Typography>
                  <TextField
                    fullWidth
                    label="Rich Menu Name"
                    value={richMenuForm.name}
                    onChange={(e) => setRichMenuForm({...richMenuForm, name: e.target.value})}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Chat Bar Text"
                    value={richMenuForm.chatBarText}
                    onChange={(e) => setRichMenuForm({...richMenuForm, chatBarText: e.target.value})}
                    placeholder="Text shown in chat bar when rich menu is active"
                    helperText="This text appears in the chat input area when the rich menu is displayed"
                    margin="normal"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={richMenuForm.displayByDefault}
                        onChange={(e) => setRichMenuForm({...richMenuForm, displayByDefault: e.target.checked})}
                      />
                    }
                    label="Display by Default"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 0.5 }}>
                    When enabled, this rich menu will be displayed by default when users open the chat
                  </Typography>
                  <TextField
                    fullWidth
                    value={richMenuForm.body}
                    multiline
                    rows={6}
                    margin="normal"
                    InputProps={{ readOnly: true }}
                    label="Generated JSON"
                  />
                </Grid>
              )}
            </Grid>
          )}

          {createMode === 'manual' && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Rich Menu Name"
                  value={richMenuForm.name}
                  onChange={(e) => setRichMenuForm({...richMenuForm, name: e.target.value})}
                  placeholder="Enter rich menu name"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Chat Bar Text"
                  value={richMenuForm.chatBarText}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 14) {
                      setRichMenuForm({...richMenuForm, chatBarText: value});
                    }
                  }}
                  placeholder="Text shown in chat bar when rich menu is active"
                  helperText={`${richMenuForm.chatBarText.length}/14 characters (LINE API limit) - This text appears in the chat input area when the rich menu is displayed`}
                  margin="normal"
                  inputProps={{ maxLength: 14 }}
                  error={richMenuForm.chatBarText.length > 14}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={richMenuForm.displayByDefault}
                      onChange={(e) => setRichMenuForm({...richMenuForm, displayByDefault: e.target.checked})}
                    />
                  }
                  label="Display by Default"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 0.5 }}>
                  When enabled, this rich menu will be displayed by default when users open the chat
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Rich Menu Body (JSON)
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={async () => {
                      try {
                        const richMenuData = JSON.parse(richMenuForm.body);
                        const response = await autoCorrectRichMenu(richMenuData);
                        if (response.data.success) {
                          setRichMenuForm({
                            ...richMenuForm,
                            body: JSON.stringify(response.data.corrected_data, null, 2)
                          });
                          setSuccess('JSON auto-corrected successfully!');
                        }
                      } catch (err: any) {
                        setError('Invalid JSON format. Please fix the JSON syntax first.');
                      }
                    }}
                    sx={{ ml: 'auto' }}
                  >
                    Auto-Correct JSON
                  </Button>
                </Box>
                <TextField
                  fullWidth
                  value={richMenuForm.body}
                  onChange={(e) => setRichMenuForm({...richMenuForm, body: e.target.value})}
                  multiline
                  rows={8}
                  placeholder='{
  "size": { "width": 2500, "height": 1686 },
  "selected": false,
  "name": "Rich Menu",
  "chatBarText": "Tap to open",
  "areas": [
    {
      "bounds": { "x": 0, "y": 0, "width": 2500, "height": 1686 },
      "action": { "type": "postback", "data": "action=menu&item=main" }
    }
  ]
}'
                  helperText="Complete JSON body sent to LINE API. Use Auto-Correct JSON to fix common format issues."
                  margin="normal"
                />
              </Grid>
            </Grid>
          )}

          {createMode === 'import' && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Import Rich Menu JSON</Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Instructions:</strong>
                    <br />
                    • Paste your rich menu JSON below
                    <br />
                    • The hotspots will be displayed on the canvas
                    <br />
                    • You can then edit, move, or modify the imported hotspots
                  </Typography>
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Rich Menu JSON"
                  value={jsonImportText}
                  onChange={(e) => setJsonImportText(e.target.value)}
                  placeholder="Paste your rich menu JSON here..."
                  multiline
                  rows={12}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    onClick={handleJsonImport}
                    startIcon={<CloudUpload />}
                    disabled={!jsonImportText.trim()}
                  >
                    Import & Display Hotspots
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={clearImportedHotspots}
                    startIcon={<Delete />}
                    disabled={!showImportedHotspots}
                  >
                    Clear Imported Hotspots
                  </Button>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showImportedHotspots}
                        onChange={(e) => setShowImportedHotspots(e.target.checked)}
                        disabled={importedHotspots.length === 0}
                      />
                    }
                    label="Show Imported Hotspots"
                  />
                </Box>
              </Grid>
              {showImportedHotspots && importedHotspots.length > 0 && (
                <Grid item xs={12}>
                  <Alert severity="success">
                    <Typography variant="body2">
                      <strong>Imported {importedHotspots.length} hotspots!</strong>
                      <br />
                      • Hotspots are displayed on the canvas with unique colors
                      <br />
                      • You can now edit, move, or modify them
                      <br />
                      • Use the "Create Rich Menu" button to create the final rich menu
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCreateDialogOpen(false);
            resetCreateForm();
            setButtons([]);
            setBackgroundImageUrl('');
          }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              console.log('Button clicked!');
              console.log('createMode:', createMode);
              console.log('creating:', creating);
              console.log('richMenuForm.name:', richMenuForm.name);
              console.log('hotspots.length:', hotspots.length);
              console.log('Button disabled:', creating || !richMenuForm.name.trim() || (createMode === 'visual' && hotspots.length === 0));
              
              if (createMode === 'visual') {
                handleCanvasCreate();
              } else {
                handleCreateRichMenu();
              }
            }}
            variant="contained"
            disabled={creating || !richMenuForm.name.trim() || (createMode === 'visual' && (hotspots.length === 0 || !backgroundImageFile))}
            startIcon={creating ? <CircularProgress size={16} /> : <Add />}
          >
            {creating ? 'Creating...' : 'Create Rich Menu'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Image Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedRichMenuForUpload?.hasImage ? 'Change Rich Menu Image' : 'Upload Rich Menu Image'}
        </DialogTitle>
        <DialogContent>
          {selectedRichMenuForUpload && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Rich Menu: {selectedRichMenuForUpload.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ID: {selectedRichMenuForUpload.richMenuId}
              </Typography>
            </Box>
          )}
          
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'error.main' }}>
            * Rich Menu Image (Required)
          </Typography>
          {selectedRichMenuForUpload?.hasImage && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Changing the image will create a new rich menu with a new ID. 
                The old rich menu will be deleted from LINE. If this rich menu was set as default, 
                the new rich menu will automatically be set as default.
              </Typography>
            </Alert>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="upload-rich-menu-image"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="upload-rich-menu-image">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
                color={selectedFile ? "success" : "primary"}
              >
                {selectedFile ? 'Select New Image' : 'Select Image'}
              </Button>
            </label>
            {selectedFile && (
              <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                ✓ {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)
              </Typography>
            )}
            {!selectedFile && (
              <Typography variant="body2" color="error.main">
                Image is required for rich menu to function
              </Typography>
            )}
          </Box>

          <Alert severity="info">
            <Typography variant="body2">
              <strong>Image Requirements:</strong>
              <br />
              • Supported formats: PNG, JPEG, GIF
              <br />
              • Recommended size: {selectedRichMenuForUpload?.size.width}×{selectedRichMenuForUpload?.size.height} pixels
              <br />
              • File size: Up to 1MB
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setUploadDialogOpen(false);
            setSelectedFile(null);
          }}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (selectedRichMenuForUpload && selectedFile) {
                await handleUploadImage(selectedRichMenuForUpload.richMenuId);
                setUploadDialogOpen(false);
                setSelectedFile(null);
                setSelectedRichMenuForUpload(null);
              }
            }}
            variant="contained"
            disabled={!selectedFile}
            startIcon={uploadingImage ? <CircularProgress size={16} /> : <CloudUpload />}
          >
            {uploadingImage ? 'Processing...' : (selectedRichMenuForUpload?.hasImage ? 'Change Image' : 'Upload Image')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Button Editor Dialog */}
      <Dialog open={buttonDialogOpen} onClose={() => setButtonDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingButton ? 'Edit Button' : 'Add Button'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Button Label"
                value={editingButton?.label || ''}
                onChange={(e) => setEditingButton(editingButton ? {...editingButton, label: e.target.value} : null)}
                placeholder="Enter button label"
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Button Position & Size</Typography>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="X Position"
                    type="number"
                    value={editingButton?.bounds.x || 0}
                    onChange={(e) => setEditingButton(editingButton ? {
                      ...editingButton, 
                      bounds: {...editingButton.bounds, x: parseInt(e.target.value) || 0}
                    } : null)}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Y Position"
                    type="number"
                    value={editingButton?.bounds.y || 0}
                    onChange={(e) => setEditingButton(editingButton ? {
                      ...editingButton, 
                      bounds: {...editingButton.bounds, y: parseInt(e.target.value) || 0}
                    } : null)}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Width"
                    type="number"
                    value={editingButton?.bounds.width || 200}
                    onChange={(e) => setEditingButton(editingButton ? {
                      ...editingButton, 
                      bounds: {...editingButton.bounds, width: parseInt(e.target.value) || 200}
                    } : null)}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Height"
                    type="number"
                    value={editingButton?.bounds.height || 100}
                    onChange={(e) => setEditingButton(editingButton ? {
                      ...editingButton, 
                      bounds: {...editingButton.bounds, height: parseInt(e.target.value) || 100}
                    } : null)}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Button Action</Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>Action Type</InputLabel>
                <Select
                  value={editingButton?.action.type || 'postback'}
                  onChange={(e) => setEditingButton(editingButton ? {
                    ...editingButton,
                    action: { ...editingButton.action, type: e.target.value as any }
                  } : null)}
                >
                  <MenuItem value="postback">Postback</MenuItem>
                  <MenuItem value="message">Message</MenuItem>
                  <MenuItem value="uri">URI</MenuItem>
                  <MenuItem value="richmenuswitch">Rich Menu Switch</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {editingButton?.action.type === 'postback' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Postback Data"
                  value={editingButton.action.data || ''}
                  onChange={(e) => setEditingButton(editingButton ? {
                    ...editingButton,
                    action: { ...editingButton.action, data: e.target.value }
                  } : null)}
                  placeholder="action=menu&item=1"
                  margin="normal"
                />
              </Grid>
            )}

            {editingButton?.action.type === 'message' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Message Text"
                  value={editingButton.action.text || ''}
                  onChange={(e) => setEditingButton(editingButton ? {
                    ...editingButton,
                    action: { ...editingButton.action, text: e.target.value }
                  } : null)}
                  placeholder="Hello, world!"
                  margin="normal"
                />
              </Grid>
            )}

            {editingButton?.action.type === 'uri' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URI"
                  value={editingButton.action.uri || ''}
                  onChange={(e) => setEditingButton(editingButton ? {
                    ...editingButton,
                    action: { ...editingButton.action, uri: e.target.value }
                  } : null)}
                  placeholder="https://example.com"
                  margin="normal"
                />
              </Grid>
            )}

            {editingButton?.action.type === 'richmenuswitch' && (
              <>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Rich Menu Alias ID"
                    value={editingButton.action.richMenuAliasId || ''}
                    onChange={(e) => setEditingButton(editingButton ? {
                      ...editingButton,
                      action: { ...editingButton.action, richMenuAliasId: e.target.value }
                    } : null)}
                    placeholder="menu-main"
                    margin="normal"
                    helperText="1-40 characters, alphanumeric and hyphens only (LINE API requirement)"
                    error={editingButton.action.richMenuAliasId ? !validateRichMenuAliasId(editingButton.action.richMenuAliasId) : false}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Switch Data"
                    value={editingButton.action.data || ''}
                    onChange={(e) => setEditingButton(editingButton ? {
                      ...editingButton,
                      action: { ...editingButton.action, data: e.target.value }
                    } : null)}
                    placeholder="change-to-menu"
                    margin="normal"
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setButtonDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => editingButton && handleHotspotSave(editingButton as any)}
            variant="contained"
            disabled={!editingButton?.label?.trim()}
          >
            Save Button
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hotspot Editor Dialog */}
      <Dialog open={hotspotDialogOpen} onClose={() => setHotspotDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingHotspot ? 'Edit Hotspot' : 'Add Hotspot'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hotspot Label"
                value={editingHotspot?.label || ''}
                onChange={(e) => setEditingHotspot(editingHotspot ? {
                  ...editingHotspot,
                  label: e.target.value
                } : null)}
                placeholder="Enter hotspot label"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Hotspot Position & Size</Typography>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="X Position"
                    type="number"
                    value={editingHotspot?.bounds.x || 0}
                    onChange={(e) => setEditingHotspot(editingHotspot ? {
                      ...editingHotspot, 
                      bounds: {...editingHotspot.bounds, x: parseInt(e.target.value) || 0}
                    } : null)}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Y Position"
                    type="number"
                    value={editingHotspot?.bounds.y || 0}
                    onChange={(e) => setEditingHotspot(editingHotspot ? {
                      ...editingHotspot, 
                      bounds: {...editingHotspot.bounds, y: parseInt(e.target.value) || 0}
                    } : null)}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Width"
                    type="number"
                    value={editingHotspot?.bounds.width || 100}
                    onChange={(e) => setEditingHotspot(editingHotspot ? {
                      ...editingHotspot, 
                      bounds: {...editingHotspot.bounds, width: parseInt(e.target.value) || 100}
                    } : null)}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Height"
                    type="number"
                    value={editingHotspot?.bounds.height || 100}
                    onChange={(e) => setEditingHotspot(editingHotspot ? {
                      ...editingHotspot, 
                      bounds: {...editingHotspot.bounds, height: parseInt(e.target.value) || 100}
                    } : null)}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Hotspot Action</Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>Action Type</InputLabel>
                <Select
                  value={editingHotspot?.action.type || 'postback'}
                  onChange={(e) => setEditingHotspot(editingHotspot ? {
                    ...editingHotspot,
                    action: { ...editingHotspot.action, type: e.target.value as any }
                  } : null)}
                >
                  <MenuItem value="postback">Postback</MenuItem>
                  <MenuItem value="message">Message</MenuItem>
                  <MenuItem value="uri">URI</MenuItem>
                  <MenuItem value="richmenuswitch">Rich Menu Switch</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {editingHotspot?.action.type === 'postback' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Postback Data"
                  value={editingHotspot.action.data || ''}
                  onChange={(e) => setEditingHotspot(editingHotspot ? {
                    ...editingHotspot,
                    action: { ...editingHotspot.action, data: e.target.value }
                  } : null)}
                  placeholder="action=menu&item=1"
                  margin="normal"
                />
              </Grid>
            )}

            {editingHotspot?.action.type === 'message' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Message Text"
                  value={editingHotspot.action.text || ''}
                  onChange={(e) => setEditingHotspot(editingHotspot ? {
                    ...editingHotspot,
                    action: { ...editingHotspot.action, text: e.target.value }
                  } : null)}
                  placeholder="Hello, world!"
                  margin="normal"
                />
              </Grid>
            )}

            {editingHotspot?.action.type === 'uri' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URI"
                  value={editingHotspot.action.uri || ''}
                  onChange={(e) => {
                    let uri = e.target.value;
                    // Auto-add https:// if no protocol is specified
                    if (uri && !uri.match(/^https?:\/\//)) {
                      uri = `https://${uri}`;
                    }
                    setEditingHotspot(editingHotspot ? {
                      ...editingHotspot,
                      action: { ...editingHotspot.action, uri: uri }
                    } : null);
                  }}
                  placeholder="https://example.com"
                  margin="normal"
                  helperText="Must start with http:// or https://"
                  error={Boolean(editingHotspot?.action.uri && editingHotspot.action.uri !== '' && !editingHotspot.action.uri.match(/^https?:\/\//))}
                />
              </Grid>
            )}

            {editingHotspot?.action.type === 'richmenuswitch' && (
              <>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Rich Menu Alias ID"
                    value={editingHotspot.action.richMenuAliasId || ''}
                    onChange={(e) => setEditingHotspot(editingHotspot ? {
                      ...editingHotspot,
                      action: { ...editingHotspot.action, richMenuAliasId: e.target.value }
                    } : null)}
                    placeholder="menu-main"
                    margin="normal"
                    helperText="1-40 characters, alphanumeric and hyphens only (LINE API requirement)"
                    error={editingHotspot.action.richMenuAliasId ? !validateRichMenuAliasId(editingHotspot.action.richMenuAliasId) : false}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Switch Data"
                    value={editingHotspot.action.data || ''}
                    onChange={(e) => setEditingHotspot(editingHotspot ? {
                      ...editingHotspot,
                      action: { ...editingHotspot.action, data: e.target.value }
                    } : null)}
                    placeholder="change-to-menu"
                    margin="normal"
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHotspotDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => editingHotspot && handleHotspotSave(editingHotspot)}
            variant="contained"
            disabled={!editingHotspot?.label?.trim()}
          >
            Save Hotspot
          </Button>
          {editingHotspot && (
            <Button 
              onClick={() => handleHotspotDelete(editingHotspot.id)}
              variant="outlined"
              color="error"
              startIcon={<Delete />}
            >
              Delete Hotspot
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => contextMenu?.hotspot && handleMoveHotspot(contextMenu.hotspot.id)}>
          <ListItemIcon>
            <DragIndicator fontSize="small" />
          </ListItemIcon>
          <ListItemText>Move Hotspot</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => contextMenu?.hotspot && handleDeleteHotspot(contextMenu.hotspot.id)}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete Hotspot</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default RichMenuManager;
