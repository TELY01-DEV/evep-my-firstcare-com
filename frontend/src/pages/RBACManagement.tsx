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
  Divider,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Home,
  Person,
  Group,
  AdminPanelSettings,
  CheckCircle,
  Warning,
  Info,
  Lock,
  Public,
  School,
  LocalHospital,
  Assessment,
  Inventory,
  Settings,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

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
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data states
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);

  // Dialog states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [userRoleDialogOpen, setUserRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');

  // Form states
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });

  useEffect(() => {
    loadRBACData();
  }, []);

  const loadRBACData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('evep_token');
      
      // Load roles, permissions, and user roles
      const [rolesResponse, permissionsResponse, userRolesResponse] = await Promise.all([
        fetch('http://localhost:8014/api/v1/rbac/roles/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('http://localhost:8014/api/v1/rbac/permissions/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('http://localhost:8014/api/v1/rbac/user-roles/', {
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
        setPermissions(permissionsData.permissions || []);
      }

      if (userRolesResponse.ok) {
        const userRolesData = await userRolesResponse.json();
        setUserRoles(userRolesData.user_roles || []);
      }
    } catch (err) {
      console.error('Failed to load RBAC data:', err);
      setError('Failed to load RBAC data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    setRoleForm({
      name: '',
      description: '',
      permissions: [],
    });
    setRoleDialogOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    });
    setRoleDialogOpen(true);
  };

  const handleSaveRole = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('evep_token');
      
      const url = editingRole 
        ? `http://localhost:8014/api/v1/rbac/roles/${editingRole.id}/`
        : 'http://localhost:8014/api/v1/rbac/roles/';
      
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
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    
    try {
      const token = localStorage.getItem('evep_token');
      
      const response = await fetch(`http://localhost:8014/api/v1/rbac/roles/${roleId}/`, {
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

  const handleAssignUserRole = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('evep_token');
      
      const response = await fetch('http://localhost:8014/api/v1/rbac/user-roles/', {
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

      if (response.ok) {
        setSuccess('User role assigned successfully!');
        setUserRoleDialogOpen(false);
        setSelectedUser('');
        setSelectedRole('');
        loadRBACData();
      } else {
        setError('Failed to assign user role');
      }
    } catch (err) {
      console.error('Failed to assign user role:', err);
      setError('Failed to assign user role');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveUserRole = async (userRole: UserRole) => {
    if (!window.confirm('Are you sure you want to remove this role assignment?')) return;
    
    try {
      const token = localStorage.getItem('evep_token');
      
      const response = await fetch(`http://localhost:8014/api/v1/rbac/user-roles/${userRole.user_id}/${userRole.role_id}/`, {
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
                        disabled={role.is_system}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={role.is_system}
                        color="error"
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
              onClick={() => setUserRoleDialogOpen(true)}
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
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveUserRole(userRole)}
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
                Permissions
              </Typography>
              <Grid container spacing={1}>
                {permissions.map((permission) => (
                  <Grid item xs={12} sm={6} key={permission.id}>
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
                        <Box display="flex" alignItems="center">
                          {getPermissionIcon(permission.category)}
                          <Box sx={{ ml: 1 }}>
                            <Typography variant="body2">{permission.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {permission.description}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
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
      <Dialog open={userRoleDialogOpen} onClose={() => setUserRoleDialogOpen(false)}>
        <DialogTitle>Assign User Role</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="User ID"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                placeholder="Enter user ID"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={selectedRole}
                  label="Role"
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserRoleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAssignUserRole}
            variant="contained"
            disabled={saving || !selectedUser || !selectedRole}
          >
            {saving ? 'Assigning...' : 'Assign'}
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
