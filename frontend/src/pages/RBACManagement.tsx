import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Avatar,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Home,
  Person,
  AdminPanelSettings,
  Lock,
  Public,
  School,
  LocalHospital,
  Assessment,
  Inventory,
  Settings,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { COMPREHENSIVE_PERMISSIONS, getPermissionsByCategory, getPermissionCategories } from '../utils/comprehensivePermissions';
import RBACScreeningDemo from '../components/RBAC/RBACScreeningDemo';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  user_id: string;
  user_name: string;
  user_email: string;
  role_id: string;
  role_name: string;
  assigned_at: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  is_active: boolean;
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
      id={`rbac-tabpanel-${index}`}
      aria-labelledby={`rbac-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const RBACManagement: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data states
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Dialog states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [userRoleDialogOpen, setUserRoleDialogOpen] = useState(false);
  const [editingUserRole, setEditingUserRole] = useState<UserRole | null>(null);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  
  // User selection states
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  // Form states
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });
  
  const [permissionForm, setPermissionForm] = useState({
    name: '',
    description: '',
    category: '',
    resource: '',
    action: '',
  });
  
  // Master data states
  const [masterPermissions, setMasterPermissions] = useState<Permission[]>([]);
  const [permissionCategories, setPermissionCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [seedingPermissions, setSeedingPermissions] = useState(false);

  useEffect(() => {
    loadRBACData();
  }, []);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('evep_token');
      console.log('🔍 Loading users for RBAC dialog...');
      
      const response = await fetch('https://stardust.evep.my-firstcare.com/api/v1/user-management/?page=1&limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 User API response status:', response.status);

      if (response.ok) {
        const userData = await response.json();
        const userList = userData.users || [];
        console.log('👥 Loaded users for RBAC:', userList.length, 'users');
        setUsers(userList);
        setFilteredUsers(userList);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load users:', response.status, errorText);
        setError(`Failed to load users: ${response.status}`);
      }
    } catch (err) {
      console.error('❌ Error loading users:', err);
      setError('Failed to load users for role assignment');
    }
  };

  const loadRBACData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('evep_token');
      
      // Load roles, permissions, user roles, and users
      const [rolesResponse, permissionsResponse, userRolesResponse] = await Promise.all([
        fetch('https://stardust.evep.my-firstcare.com/api/v1/rbac/roles/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('https://stardust.evep.my-firstcare.com/api/v1/rbac/permissions/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('https://stardust.evep.my-firstcare.com/api/v1/rbac/user-roles/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.roles || []);
      }

      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        const backendPermissions = permissionsData.permissions || [];
        
        // Combine backend permissions with comprehensive permissions
        const allPermissions = [
          ...backendPermissions,
          ...COMPREHENSIVE_PERMISSIONS
        ];
        
        // Remove duplicates based on ID
        const uniquePermissions = allPermissions.filter((permission, index, self) =>
          index === self.findIndex(p => p.id === permission.id)
        );
        
        setPermissions(uniquePermissions);
        console.log('📋 Loaded permissions:', uniquePermissions.length, 'total permissions');
      } else {
        // Fallback to comprehensive permissions if backend fails
        setPermissions(COMPREHENSIVE_PERMISSIONS);
        console.log('📋 Using comprehensive permissions as fallback');
      }

      // Always ensure comprehensive permissions are available for role creation
      // Merge backend permissions with comprehensive permissions to ensure complete coverage
      const allAvailablePermissions = [
        ...COMPREHENSIVE_PERMISSIONS,
        ...permissions.filter(p => !COMPREHENSIVE_PERMISSIONS.find(cp => cp.id === p.id))
      ];
      setPermissions(allAvailablePermissions);
      
      // Always load master permissions and categories
      setMasterPermissions(COMPREHENSIVE_PERMISSIONS);
      setPermissionCategories(['all', ...getPermissionCategories()]);
      
      console.log(`📋 Total permissions available for role creation: ${allAvailablePermissions.length}`);

      if (userRolesResponse.ok) {
        const userRolesData = await userRolesResponse.json();
        setUserRoles(userRolesData.user_roles || []);
      }
      
      // Load users for role assignment
      await loadUsers();
    } catch (err) {
      console.error('Failed to load RBAC data:', err);
      setError('Failed to load RBAC data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = () => {
    console.log('🔧 Create Role button clicked');
    setEditingRole(null);
    setRoleForm({
      name: '',
      description: '',
      permissions: [],
    });
    setRoleDialogOpen(true);
    console.log('📝 Role dialog opened for creation');
  };

  const handleEditRole = (role: Role) => {
    console.log('✏️ Edit Role button clicked for:', role.name);
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    });
    setRoleDialogOpen(true);
    console.log('📝 Role dialog opened for editing:', role.name);
  };

  const handleSaveRole = async () => {
    console.log('💾 Save Role button clicked', editingRole ? 'EDIT mode' : 'CREATE mode');
    console.log('📝 Role form data:', roleForm);
    try {
      setSaving(true);
      const token = localStorage.getItem('evep_token');
      
      const url = editingRole 
        ? `https://stardust.evep.my-firstcare.com/api/v1/rbac/roles/${editingRole.id}/`
        : 'https://stardust.evep.my-firstcare.com/api/v1/rbac/roles/';
      
      const method = editingRole ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleForm),
      });

      if (response.ok) {
        setSuccess(editingRole ? 'Role updated successfully!' : 'Role created successfully!');
        setRoleDialogOpen(false);
        loadRBACData();
      } else {
        setError('Failed to save role');
      }
    } catch (err) {
      console.error('Failed to save role:', err);
      setError('Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    const roleName = role?.name || 'this role';
    console.log('🗑️ Delete Role button clicked for:', roleName);
    if (!window.confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`)) {
      console.log('❌ Delete cancelled by user');
      return;
    }
    console.log('✅ Delete confirmed, proceeding...');
    
    try {
      const token = localStorage.getItem('evep_token');
      
      const response = await fetch(`https://stardust.evep.my-firstcare.com/api/v1/rbac/roles/${roleId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSuccess('Role deleted successfully!');
        loadRBACData();
      } else {
        setError('Failed to delete role');
      }
    } catch (err) {
      console.error('Failed to delete role:', err);
      setError('Failed to delete role');
    }
  };

  const handleUserSearch = (query: string) => {
    setUserSearchQuery(query);
    if (!query.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.first_name.toLowerCase().includes(query.toLowerCase()) ||
        user.last_name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.role.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user.id);
    setUserSearchQuery(`${user.first_name} ${user.last_name} (${user.email})`);
  };

  const handleOpenUserRoleDialog = () => {
    setEditingUserRole(null);
    setUserRoleDialogOpen(true);
    setSelectedUser('');
    setSelectedRole('');
    setUserSearchQuery('');
    setFilteredUsers(users);
  };

  const handleEditUserRole = (userRole: UserRole) => {
    setEditingUserRole(userRole);
    setSelectedUser(userRole.user_id);
    setSelectedRole(userRole.role_id);
    
    // Set the search query to show the current user
    const currentUser = users.find(u => u.id === userRole.user_id);
    if (currentUser) {
      setUserSearchQuery(`${currentUser.first_name} ${currentUser.last_name} (${currentUser.email})`);
      setFilteredUsers([currentUser]);
    }
    
    setUserRoleDialogOpen(true);
  };

  const handleAssignUserRole = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('evep_token');
      
      let response;
      
      if (editingUserRole) {
        // UPDATE existing user role assignment
        response = await fetch(`https://stardust.evep.my-firstcare.com/api/v1/rbac/user-roles/${editingUserRole.user_id}/${editingUserRole.role_id}/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: selectedUser,
            role_id: selectedRole,
          }),
        });
      } else {
        // CREATE new user role assignment
        response = await fetch('https://stardust.evep.my-firstcare.com/api/v1/rbac/user-roles/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: selectedUser,
            role_id: selectedRole,
          }),
        });
      }

      if (response.ok) {
        setSuccess(editingUserRole ? 'User role updated successfully!' : 'User role assigned successfully!');
        setUserRoleDialogOpen(false);
        setEditingUserRole(null);
        setSelectedUser('');
        setSelectedRole('');
        setUserSearchQuery('');
        loadRBACData();
      } else {
        setError(editingUserRole ? 'Failed to update user role' : 'Failed to assign user role');
      }
    } catch (err) {
      console.error('Failed to assign/update user role:', err);
      setError('Failed to assign user role');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveUserRole = async (userRole: UserRole) => {
    if (!window.confirm(`Are you sure you want to remove the "${userRole.role_name}" role from ${userRole.user_name}? This action cannot be undone.`)) return;
    
    try {
      const token = localStorage.getItem('evep_token');
      
      const response = await fetch(`https://stardust.evep.my-firstcare.com/api/v1/rbac/user-roles/${userRole.user_id}/${userRole.role_id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSuccess('User role removed successfully!');
        loadRBACData();
      } else {
        setError('Failed to remove user role');
      }
    } catch (err) {
      console.error('Failed to remove user role:', err);
      setError('Failed to remove user role');
    }
  };

  // Seed comprehensive permissions to backend
  const seedPermissions = async () => {
    try {
      setSeedingPermissions(true);
      const token = localStorage.getItem('evep_token');
      
      const response = await fetch('https://stardust.evep.my-firstcare.com/api/v1/rbac/permissions/seed', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions: COMPREHENSIVE_PERMISSIONS
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(`Successfully seeded ${result.count} permissions to master data`);
        
        // Force update the permissions state with comprehensive permissions
        setPermissions(COMPREHENSIVE_PERMISSIONS);
        console.log('🌱 Seeded and updated permissions state with comprehensive data');
        
        await loadRBACData(); // Reload data
      } else {
        setError('Failed to seed permissions');
      }
    } catch (err) {
      console.error('Failed to seed permissions:', err);
      setError('Failed to seed permissions');
    } finally {
      setSeedingPermissions(false);
    }
  };

  const getPermissionIcon = (category: string) => {
    switch (category) {
      case 'patient':
        return <Person />;
      case 'screening':
        return <Assessment />;
      case 'school':
        return <School />;
      case 'medical':
        return <LocalHospital />;
      case 'inventory':
        return <Inventory />;
      case 'system':
        return <Settings />;
      default:
        return <SecurityIcon />;
    }
  };

  const handleCreatePermission = () => {
    console.log('🔧 Create Permission button clicked');
    setEditingPermission(null);
    setPermissionForm({
      name: '',
      description: '',
      category: '',
      resource: '',
      action: '',
    });
    setPermissionDialogOpen(true);
    console.log('📝 Permission dialog opened for creation');
  };

  const handleEditPermission = (permission: Permission) => {
    console.log('✏️ Edit Permission button clicked for:', permission.name);
    setEditingPermission(permission);
    setPermissionForm({
      name: permission.name,
      description: permission.description,
      category: permission.category,
      resource: permission.resource,
      action: permission.action,
    });
    setPermissionDialogOpen(true);
    console.log('📝 Permission dialog opened for editing:', permission.name);
  };

  const handleSavePermission = async () => {
    console.log('💾 Save Permission button clicked', editingPermission ? 'EDIT mode' : 'CREATE mode');
    console.log('📝 Permission form data:', permissionForm);
    try {
      setSaving(true);
      const token = localStorage.getItem('evep_token');
      
      const url = editingPermission 
        ? `https://stardust.evep.my-firstcare.com/api/v1/rbac/permissions/${editingPermission.id}/`
        : 'https://stardust.evep.my-firstcare.com/api/v1/rbac/permissions/';
      
      const method = editingPermission ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(permissionForm),
      });

      if (response.ok) {
        setSuccess(editingPermission ? 'Permission updated successfully!' : 'Permission created successfully!');
        setPermissionDialogOpen(false);
        loadRBACData();
      } else {
        setError('Failed to save permission');
      }
    } catch (err) {
      console.error('Failed to save permission:', err);
      setError('Failed to save permission');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    const permission = permissions.find(p => p.id === permissionId);
    const permissionName = permission?.name || 'this permission';
    console.log('🗑️ Delete Permission button clicked for:', permissionName);
    if (!window.confirm(`Are you sure you want to delete the permission "${permissionName}"? This action cannot be undone.`)) {
      console.log('❌ Delete cancelled by user');
      return;
    }
    console.log('✅ Delete confirmed, proceeding...');
    
    try {
      const token = localStorage.getItem('evep_token');
      
      const response = await fetch(`https://stardust.evep.my-firstcare.com/api/v1/rbac/permissions/${permissionId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSuccess('Permission deleted successfully!');
        loadRBACData();
      } else {
        setError('Failed to delete permission');
      }
    } catch (err) {
      console.error('Failed to delete permission:', err);
      setError('Failed to delete permission');
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'system_admin':
        return 'error';
      case 'medical_admin':
        return 'primary';
      case 'doctor':
        return 'success';
      case 'nurse':
        return 'info';
      case 'teacher':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            underline="hover"
            color="inherit"
            href="/dashboard"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Home sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Typography
            sx={{ display: 'flex', alignItems: 'center' }}
            color="text.primary"
          >
            <SecurityIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            RBAC Management
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            RBAC Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage roles, permissions, and user access control
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadRBACData}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateRole}
          >
            Create Role
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={handleCreatePermission}
          >
            Create Permission
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
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

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Roles" />
          <Tab label="Permissions" />
          <Tab label="User Roles" />
          <Tab label="Master Data" />
          <Tab label="Screening RBAC" />
        </Tabs>

        {/* Roles Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {roles.map((role) => (
              <Grid item xs={12} md={6} lg={4} key={role.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" component="h2">
                        {role.name}
                      </Typography>
                      <Chip
                        label={role.is_system ? 'System' : 'Custom'}
                        color={role.is_system ? 'primary' : 'default'}
                        size="small"
                      />
                    </Box>
                    <Typography color="text.secondary" gutterBottom>
                      {role.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {role.permissions.length} permissions
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditRole(role)}
                        disabled={role.is_system && !isSuperAdmin}
                        title={role.is_system && !isSuperAdmin ? "System roles can only be edited by super admin" : "Edit role"}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={role.is_system && !isSuperAdmin}
                        color="error"
                        title={role.is_system && !isSuperAdmin ? "System roles can only be deleted by super admin" : "Delete role"}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Permissions Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={2}>
            {permissions.map((permission) => (
              <Grid item xs={12} sm={6} md={4} key={permission.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      {getPermissionIcon(permission.category)}
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {permission.name}
                      </Typography>
                    </Box>
                    <Typography color="text.secondary" gutterBottom>
                      {permission.description}
                    </Typography>
                    <Chip
                      label={`${permission.resource}:${permission.action}`}
                      size="small"
                      variant="outlined"
                    />
                    {isSuperAdmin && (
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditPermission(permission)}
                          title="Edit permission"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeletePermission(permission.id)}
                          color="error"
                          title="Delete permission"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* User Roles Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenUserRoleDialog}
            >
              Assign User Role
            </Button>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Assigned</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userRoles.map((userRole) => (
                  <TableRow key={`${userRole.user_id}-${userRole.role_id}`}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                          <Person />
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{userRole.user_name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {userRole.user_email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={userRole.role_name}
                        color={getRoleColor(userRole.role_name) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(userRole.assigned_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditUserRole(userRole)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveUserRole(userRole)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Master Data Tab */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Permission Master Data Management
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Manage comprehensive permissions master data. Seed permissions to MongoDB and manage system-wide permission definitions.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="contained"
                startIcon={seedingPermissions ? <CircularProgress size={20} /> : <RefreshIcon />}
                onClick={seedPermissions}
                disabled={seedingPermissions}
                color="primary"
              >
                {seedingPermissions ? 'Seeding...' : 'Seed Master Permissions'}
              </Button>
              
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Category Filter</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Category Filter"
                >
                  {permissionCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Master Permissions Grid */}
          <Grid container spacing={2}>
            {masterPermissions
              .filter(permission => selectedCategory === 'all' || permission.category === selectedCategory)
              .map((permission) => (
                <Grid item xs={12} sm={6} md={4} key={permission.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {getPermissionIcon(permission.category)}
                        <Typography variant="h6" sx={{ ml: 1, fontSize: '1rem' }}>
                          {permission.name}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {permission.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        <Chip 
                          label={permission.category} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                        <Chip 
                          label={permission.resource} 
                          size="small" 
                          color="secondary" 
                          variant="outlined"
                        />
                        <Chip 
                          label={permission.action} 
                          size="small" 
                          color="default" 
                          variant="outlined"
                        />
                      </Box>
                      
                      <Typography variant="caption" color="text.secondary">
                        ID: {permission.id}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>

          {/* Master Data Statistics */}
          <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Master Data Statistics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" color="primary">
                      {masterPermissions.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Master Permissions
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" color="secondary">
                      {permissionCategories.length - 1}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Permission Categories
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" color="success.main">
                      {permissions.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Permissions
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" color="warning.main">
                      {roles.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Roles
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Screening RBAC Demo Tab */}
        <TabPanel value={activeTab} index={4}>
          <RBACScreeningDemo />
        </TabPanel>
      </Paper>

      {/* Role Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRole ? 'Edit Role' : 'Create New Role'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Role Name"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Permissions ({COMPREHENSIVE_PERMISSIONS.length} available)
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Select permissions for this role. Includes all menus, child menus, and screening forms.
              </Typography>
              
              {/* Permission Categories */}
              {getPermissionCategories().map(category => {
                const categoryPermissions = getPermissionsByCategory(category);
                const selectedInCategory = categoryPermissions.filter(p => roleForm.permissions.includes(p.id)).length;
                
                return (
                  <Box key={category} sx={{ mb: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getPermissionIcon(category)}
                        <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                          {category} Permissions
                        </Typography>
                        <Chip
                          label={`${selectedInCategory}/${categoryPermissions.length}`}
                          color={selectedInCategory > 0 ? 'primary' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Box>
                        <Button
                          size="small"
                          onClick={() => {
                            // Select all in category
                            const categoryIds = categoryPermissions.map(p => p.id);
                            const newPermissions = Array.from(new Set([...roleForm.permissions, ...categoryIds]));
                            setRoleForm({ ...roleForm, permissions: newPermissions });
                          }}
                          sx={{ mr: 1 }}
                        >
                          Select All
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            // Deselect all in category
                            const categoryIds = categoryPermissions.map(p => p.id);
                            const newPermissions = roleForm.permissions.filter(id => !categoryIds.includes(id));
                            setRoleForm({ ...roleForm, permissions: newPermissions });
                          }}
                        >
                          Clear
                        </Button>
                      </Box>
                    </Box>
                    
                    <Grid container spacing={1}>
                      {categoryPermissions.map((permission) => (
                        <Grid item xs={12} sm={6} md={4} key={permission.id}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={roleForm.permissions.includes(permission.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setRoleForm({
                                      ...roleForm,
                                      permissions: [...roleForm.permissions, permission.id],
                                    });
                                  } else {
                                    setRoleForm({
                                      ...roleForm,
                                      permissions: roleForm.permissions.filter(p => p !== permission.id),
                                    });
                                  }
                                }}
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body2" fontWeight="medium">{permission.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {permission.description}
                                </Typography>
                                <Box sx={{ mt: 0.5 }}>
                                  <Chip
                                    label={`${permission.resource}:${permission.action}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem', height: 16 }}
                                  />
                                </Box>
                              </Box>
                            }
                            sx={{
                              alignItems: 'flex-start',
                              border: 1,
                              borderColor: 'grey.200',
                              borderRadius: 1,
                              p: 1,
                              m: 0.5,
                              '&:hover': {
                                backgroundColor: 'grey.50'
                              }
                            }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                );
              })}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveRole}
            variant="contained"
            disabled={saving || !roleForm.name}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Role Assignment Dialog */}
      <Dialog open={userRoleDialogOpen} onClose={() => setUserRoleDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <AdminPanelSettings sx={{ mr: 1 }} />
            {editingUserRole ? 'Edit User Role' : 'Assign User Role'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* User Search and Selection */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Select User
              </Typography>
              <TextField
                fullWidth
                label="Search Users"
                value={userSearchQuery}
                onChange={(e) => handleUserSearch(e.target.value)}
                placeholder="Search by name, email, or role..."
                variant="outlined"
                sx={{ mb: 2 }}
              />
              
              {/* User List */}
              <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                <List>
                  {filteredUsers.length === 0 ? (
                    <ListItem>
                      <ListItemText 
                        primary="No users found" 
                        secondary={users.length === 0 ? "Loading users..." : "Try adjusting your search terms"}
                      />
                    </ListItem>
                  ) : (
                    filteredUsers.map((user) => (
                      <ListItem
                        key={user.id}
                        button
                        selected={selectedUser === user.id}
                        onClick={() => handleUserSelect(user)}
                        sx={{
                          '&.Mui-selected': {
                            backgroundColor: 'primary.light',
                            color: 'primary.contrastText',
                          },
                        }}
                      >
                        <ListItemIcon>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            <Person />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={`${user.first_name} ${user.last_name}`}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {user.email}
                              </Typography>
                              <Chip
                                label={user.role}
                                size="small"
                                color={getRoleColor(user.role) as any}
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          {user.is_active ? (
                            <Chip label="Active" color="success" size="small" />
                          ) : (
                            <Chip label="Inactive" color="default" size="small" />
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))
                  )}
                </List>
              </Paper>
            </Grid>

            {/* Role Selection */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Select Role to Assign
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={selectedRole}
                  label="Role"
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <Box>
                          <Typography variant="body1">{role.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {role.description}
                          </Typography>
                        </Box>
                        <Chip
                          label={role.is_system ? 'System' : 'Custom'}
                          color={role.is_system ? 'primary' : 'default'}
                          size="small"
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Selected Summary */}
            {selectedUser && selectedRole && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Assignment Summary:</strong><br />
                    User: {users.find(u => u.id === selectedUser)?.first_name} {users.find(u => u.id === selectedUser)?.last_name} 
                    ({users.find(u => u.id === selectedUser)?.email})<br />
                    Role: {roles.find(r => r.id === selectedRole)?.name}
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserRoleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAssignUserRole}
            variant="contained"
            disabled={saving || !selectedUser || !selectedRole}
            startIcon={saving ? <CircularProgress size={16} /> : <AdminPanelSettings />}
          >
            {saving 
              ? (editingUserRole ? 'Updating...' : 'Assigning...') 
              : (editingUserRole ? 'Update Role' : 'Assign Role')
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permission Dialog */}
      <Dialog open={permissionDialogOpen} onClose={() => setPermissionDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <SecurityIcon sx={{ mr: 1 }} />
              {editingPermission ? 'Edit Permission' : 'Create New Permission'}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Permission Name"
                  value={permissionForm.name}
                  onChange={(e) => setPermissionForm({ ...permissionForm, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={permissionForm.category}
                    label="Category"
                    onChange={(e) => setPermissionForm({ ...permissionForm, category: e.target.value })}
                  >
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="patient">Patient</MenuItem>
                    <MenuItem value="screening">Screening</MenuItem>
                    <MenuItem value="medical">Medical</MenuItem>
                    <MenuItem value="school">School</MenuItem>
                    <MenuItem value="inventory">Inventory</MenuItem>
                    <MenuItem value="system">System</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={permissionForm.description}
                  onChange={(e) => setPermissionForm({ ...permissionForm, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Resource"
                  value={permissionForm.resource}
                  onChange={(e) => setPermissionForm({ ...permissionForm, resource: e.target.value })}
                  placeholder="e.g., users, patients, screenings"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Action</InputLabel>
                  <Select
                    value={permissionForm.action}
                    label="Action"
                    onChange={(e) => setPermissionForm({ ...permissionForm, action: e.target.value })}
                  >
                    <MenuItem value="view">View</MenuItem>
                    <MenuItem value="create">Create</MenuItem>
                    <MenuItem value="update">Update</MenuItem>
                    <MenuItem value="delete">Delete</MenuItem>
                    <MenuItem value="manage">Manage</MenuItem>
                    <MenuItem value="all">All</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPermissionDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSavePermission}
              variant="contained"
              disabled={saving || !permissionForm.name || !permissionForm.category || !permissionForm.resource || !permissionForm.action}
              startIcon={saving ? <CircularProgress size={16} /> : <SecurityIcon />}
            >
              {saving ? (editingPermission ? 'Updating...' : 'Creating...') : (editingPermission ? 'Update Permission' : 'Create Permission')}
            </Button>
          </DialogActions>
        </Dialog>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RBACManagement;
