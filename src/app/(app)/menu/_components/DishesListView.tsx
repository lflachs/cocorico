'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Pencil, Trash2, RefreshCw, Zap, FolderPlus, Folder, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { toast } from 'sonner';
import { DishEditModal } from './DishEditModal';
import { CreateButton } from '@/components/CreateButton';
import { DishQuickCreateFlow } from './DishQuickCreateFlow';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

/**
 * Dishes List View - Manage all dishes à la carte
 * Shows all dishes with search, create, edit, and delete functionality
 */

type DishFolder = {
  id: string;
  name: string;
  color?: string | null;
  order: number;
  _count?: {
    dishes: number;
  };
};

type Dish = {
  id: string;
  name: string;
  description?: string | null;
  sellingPrice?: number | null;
  isActive: boolean;
  folderId?: string | null;
  folder?: DishFolder | null;
  recipeIngredients?: {
    id: string;
    quantityRequired: number;
    unit: string;
    product: {
      id: string;
      name: string;
      unitPrice?: number | null;
    };
  }[];
};

export function DishesListView() {
  const router = useRouter();
  const { t } = useLanguage();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [folders, setFolders] = useState<DishFolder[]>([]);
  const [filteredDishes, setFilteredDishes] = useState<Dish[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [selectedDishIds, setSelectedDishIds] = useState<Set<string>>(new Set());
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#3b82f6');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [filterFolderId, setFilterFolderId] = useState<string | 'all' | null>('all');
  const [draggedDishId, setDraggedDishId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  const loadDishes = async () => {
    setLoading(true);
    try {
      const { getDishesAction } = await import('@/lib/actions/dish.actions');
      const result = await getDishesAction({ includeRecipe: true });
      if (result.success && result.data) {
        setDishes(result.data as Dish[]);
        setFilteredDishes(result.data as Dish[]);
      }
    } catch (error) {
      console.error('Error loading dishes:', error);
      toast.error('Failed to load dishes');
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const { getDishFoldersAction } = await import('@/lib/actions/dish-folder.actions');
      const result = await getDishFoldersAction();
      if (result.success && result.data) {
        setFolders(result.data as DishFolder[]);
      }
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Veuillez entrer un nom de dossier');
      return;
    }

    try {
      const { createDishFolderAction } = await import('@/lib/actions/dish-folder.actions');
      const result = await createDishFolderAction(newFolderName.trim(), newFolderColor);

      if (result.success) {
        toast.success('Dossier créé avec succès');
        setNewFolderName('');
        setNewFolderColor('#3b82f6');
        setShowCreateFolder(false);
        loadFolders();
      } else {
        toast.error(result.error || 'Échec de la création du dossier');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Échec de la création du dossier');
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (!confirm(`Supprimer le dossier "${folderName}" ? Les plats de ce dossier seront déplacés vers "Sans dossier".`)) {
      return;
    }

    try {
      const { deleteDishFolderAction } = await import('@/lib/actions/dish-folder.actions');
      const result = await deleteDishFolderAction(folderId);

      if (result.success) {
        toast.success('Dossier supprimé avec succès');
        loadFolders();
        loadDishes();
      } else {
        toast.error(result.error || 'Échec de la suppression du dossier');
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Échec de la suppression du dossier');
    }
  };

  const handleMoveDishesToFolder = async (folderId: string | null) => {
    if (selectedDishIds.size === 0) {
      toast.error('Veuillez sélectionner des plats à déplacer');
      return;
    }

    try {
      const { moveDishesToFolderAction } = await import('@/lib/actions/dish-folder.actions');
      const result = await moveDishesToFolderAction(Array.from(selectedDishIds), folderId);

      if (result.success) {
        const folderName = folderId
          ? folders.find(f => f.id === folderId)?.name
          : 'Sans dossier';
        toast.success(`${selectedDishIds.size} plat(s) déplacé(s) vers "${folderName}"`);
        setSelectedDishIds(new Set());
        setSelectedFolderId(null);
        loadDishes();
        loadFolders();
      } else {
        toast.error(result.error || 'Échec du déplacement des plats');
      }
    } catch (error) {
      console.error('Error moving dishes:', error);
      toast.error('Échec du déplacement des plats');
    }
  };

  const toggleDishSelection = (dishId: string) => {
    const newSelection = new Set(selectedDishIds);
    if (newSelection.has(dishId)) {
      newSelection.delete(dishId);
    } else {
      newSelection.add(dishId);
    }
    setSelectedDishIds(newSelection);
  };

  const handleDragStart = (dishId: string) => {
    setDraggedDishId(dishId);
  };

  const handleDragEnd = () => {
    setDraggedDishId(null);
    setDragOverFolderId(null);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    if (!draggedDishId) return;

    const dishesToMove = selectedDishIds.has(draggedDishId)
      ? Array.from(selectedDishIds)
      : [draggedDishId];

    try {
      const { moveDishesToFolderAction } = await import('@/lib/actions/dish-folder.actions');
      const result = await moveDishesToFolderAction(dishesToMove, targetFolderId);

      if (result.success) {
        const folderName = targetFolderId
          ? folders.find(f => f.id === targetFolderId)?.name
          : 'Sans dossier';
        toast.success(`Déplacé ${dishesToMove.length} plat(s) vers "${folderName}"`);
        setSelectedDishIds(new Set());
        loadDishes();
        loadFolders();
      } else {
        toast.error(result.error || 'Échec du déplacement des plats');
      }
    } catch (error) {
      console.error('Error moving dishes:', error);
      toast.error('Échec du déplacement des plats');
    }

    setDraggedDishId(null);
    setDragOverFolderId(null);
  };

  const toggleFolderCollapse = (folderId: string) => {
    const newCollapsed = new Set(collapsedFolders);
    if (newCollapsed.has(folderId)) {
      newCollapsed.delete(folderId);
    } else {
      newCollapsed.add(folderId);
    }
    setCollapsedFolders(newCollapsed);
  };

  useEffect(() => {
    loadDishes();
    loadFolders();
  }, []);

  // Filter dishes based on search and folder
  useEffect(() => {
    let filtered = dishes;

    // Apply folder filter
    if (filterFolderId !== 'all') {
      if (filterFolderId === null) {
        // Filter for "Sans dossier" (no folder)
        filtered = filtered.filter(dish => !dish.folderId);
      } else {
        // Filter for specific folder
        filtered = filtered.filter(dish => dish.folderId === filterFolderId);
      }
    }

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (dish) =>
          dish.name.toLowerCase().includes(query) ||
          dish.description?.toLowerCase().includes(query)
      );
    }

    setFilteredDishes(filtered);
  }, [searchQuery, dishes, filterFolderId]);

  const handleCreateDish = () => {
    router.push('/menu/create-dish');
  };

  const handleEditDish = (dish: Dish) => {
    setSelectedDish(dish);
    setShowEditModal(true);
  };

  const handleDeleteDish = async (dishId: string, dishName: string) => {
    if (!confirm(`Are you sure you want to delete "${dishName}"?`)) {
      return;
    }

    try {
      const { deleteDishAction } = await import('@/lib/actions/dish.actions');
      const result = await deleteDishAction(dishId);

      if (result.success) {
        toast.success('Dish deleted successfully');
        loadDishes();
      } else {
        toast.error(result.error || 'Failed to delete dish');
      }
    } catch (error) {
      console.error('Error deleting dish:', error);
      toast.error('Failed to delete dish');
    }
  };

  const calculateDishCost = (dish: Dish): number => {
    if (!dish.recipeIngredients || dish.recipeIngredients.length === 0) {
      return 0;
    }
    return dish.recipeIngredients.reduce((total, ing) => {
      const unitPrice = ing.product?.unitPrice || 0;
      return total + ing.quantityRequired * unitPrice;
    }, 0);
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <RefreshCw className="text-primary mx-auto h-8 w-8 animate-spin" />
        <p className="text-muted-foreground mt-2 text-sm">Loading dishes...</p>
      </div>
    );
  }

  // Group ALL dishes by folder for accurate counts
  const allGroupedDishes = dishes.reduce((acc, dish) => {
    const key = dish.folderId || 'no-folder';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(dish);
    return acc;
  }, {} as Record<string, Dish[]>);

  // Group filtered dishes by folder for display
  const groupedDishes = filteredDishes.reduce((acc, dish) => {
    const key = dish.folderId || 'no-folder';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(dish);
    return acc;
  }, {} as Record<string, Dish[]>);

  const FOLDER_COLORS = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // green
    '#14b8a6', // teal
    '#f97316', // orange
    '#ef4444', // red
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Folders Bar */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {/* All Dishes */}
          <button
            onClick={() => {
              if (selectedDishIds.size === 0) {
                setFilterFolderId('all');
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              filterFolderId === 'all'
                ? 'bg-primary text-white shadow-sm'
                : selectedDishIds.size > 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
            }`}
          >
            <Folder className="h-4 w-4" />
            <span className="text-sm font-medium">Tous les plats</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              filterFolderId === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-white text-gray-600'
            }`}>
              {dishes.length}
            </span>
          </button>

          {/* No Folder */}
          <button
            onClick={() => {
              if (selectedDishIds.size > 0) {
                handleMoveDishesToFolder(null);
              } else {
                setFilterFolderId(null);
              }
            }}
            onDragOver={(e) => handleDragOver(e, null)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, null)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              filterFolderId === null
                ? 'bg-gray-700 text-white shadow-sm'
                : dragOverFolderId === null
                ? 'bg-primary/20 border-2 border-primary text-gray-700'
                : selectedDishIds.size > 0
                ? 'bg-gray-100 border-2 border-dashed border-gray-400 text-gray-700 hover:border-gray-600 cursor-pointer'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
            }`}
          >
            <Folder className="h-4 w-4" />
            <span className="text-sm font-medium">Sans dossier</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              filterFolderId === null
                ? 'bg-white/20 text-white'
                : 'bg-white text-gray-600'
            }`}>
              {allGroupedDishes['no-folder'] ? allGroupedDishes['no-folder'].length : 0}
            </span>
          </button>

          {/* Existing Folders */}
          {folders.map((folder) => (
            <div key={folder.id} className="relative group">
              <button
                onClick={() => {
                  if (selectedDishIds.size > 0) {
                    handleMoveDishesToFolder(folder.id);
                  } else {
                    setFilterFolderId(folder.id);
                  }
                }}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  dragOverFolderId === folder.id
                    ? 'ring-2 scale-105'
                    : selectedDishIds.size > 0
                    ? 'cursor-pointer border-2 border-dashed'
                    : 'cursor-pointer hover:opacity-90'
                }`}
                style={{
                  borderColor: dragOverFolderId === folder.id
                    ? folder.color || '#3b82f6'
                    : selectedDishIds.size > 0
                    ? `${folder.color || '#3b82f6'}80`
                    : 'transparent',
                  backgroundColor: filterFolderId === folder.id
                    ? folder.color || '#3b82f6'
                    : `${folder.color || '#3b82f6'}20`,
                  color: filterFolderId === folder.id ? 'white' : folder.color || '#3b82f6',
                }}
              >
                <Folder className="h-4 w-4" />
                <span className="text-sm font-medium">{folder.name}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: filterFolderId === folder.id
                      ? 'rgba(255,255,255,0.25)'
                      : 'rgba(255,255,255,0.8)',
                    color: filterFolderId === folder.id ? 'white' : folder.color || '#3b82f6',
                  }}
                >
                  {allGroupedDishes[folder.id] ? allGroupedDishes[folder.id].length : 0}
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(folder.id, folder.name);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-50"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* Create Folder Button */}
          <button
            onClick={() => setShowCreateFolder(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all whitespace-nowrap cursor-pointer"
          >
            <FolderPlus className="h-4 w-4" />
            <span className="text-sm font-medium">Nouveau</span>
          </button>
        </div>

        {/* Selection Info */}
        {selectedDishIds.size > 0 && (
          <div className="bg-primary/10 border border-primary rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedDishIds.size} plat(s) sélectionné(s) - Cliquez sur un dossier pour déplacer
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDishIds(new Set())}
            >
              Désélectionner tout
            </Button>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              type="text"
              placeholder={t('menu.search') || 'Search dishes...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cursor-text pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowQuickCreate(true)}
              size="lg"
              className="gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
            >
              <Zap className="w-5 h-5" />
              Création rapide
            </Button>
          </div>
        </div>

        {/* Dishes Grid */}
        {filteredDishes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              {searchQuery ? (
                <>
                  <p className="text-muted-foreground mb-4">
                    No dishes found matching "{searchQuery}"
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery('')}
                    className="cursor-pointer"
                  >
                    {t('menu.clearSearch')}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-4">{t('menu.empty')}</p>
                  <CreateButton onClick={handleCreateDish}>{t('menu.emptyHint')}</CreateButton>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Render dishes grouped by folder */}
            {Object.entries(groupedDishes).map(([folderId, folderDishes]) => {
              const folder = folders.find((f) => f.id === folderId);
              const folderName = folderId === 'no-folder' ? 'Sans dossier' : folder?.name || 'Sans dossier';
              const isCollapsed = filterFolderId === 'all' && collapsedFolders.has(folderId);

              return (
                <div key={folderId}>
                  <button
                    onClick={() => toggleFolderCollapse(folderId)}
                    className={`group mb-4 flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-all ${
                      filterFolderId === 'all'
                        ? 'hover:bg-gray-50 cursor-pointer'
                        : 'cursor-default'
                    }`}
                    style={{
                      borderLeft: `4px solid ${folder?.color || '#6b7280'}`,
                      backgroundColor: filterFolderId === 'all' ? 'transparent' : `${folder?.color || '#6b7280'}08`,
                    }}
                    disabled={filterFolderId !== 'all'}
                  >
                    {filterFolderId === 'all' && (
                      <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                        {isCollapsed ? (
                          <ChevronRight className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    )}
                    <Folder
                      className="h-5 w-5 flex-shrink-0"
                      style={{ color: folder?.color || '#6b7280' }}
                    />
                    <span className="text-lg font-semibold text-gray-800 flex-1">{folderName}</span>
                    <span
                      className="text-sm font-medium px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: `${folder?.color || '#6b7280'}15`,
                        color: folder?.color || '#6b7280',
                      }}
                    >
                      {folderDishes.length}
                    </span>
                  </button>
                  {!isCollapsed && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {folderDishes.map((dish) => {
                      const cost = calculateDishCost(dish);
                      const sellingPrice = dish.sellingPrice;
                      const margin =
                        cost > 0 && sellingPrice ? ((sellingPrice - cost) / sellingPrice) * 100 : null;

                      return (
                        <Card
                          key={dish.id}
                          draggable
                          onDragStart={() => handleDragStart(dish.id)}
                          onDragEnd={handleDragEnd}
                          className={`transition-all hover:shadow-lg cursor-move ${
                            selectedDishIds.has(dish.id) ? 'ring-2 ring-primary' : ''
                          } ${draggedDishId === dish.id ? 'opacity-50' : ''}`}
                        >
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              {/* Header with Checkbox */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-3 flex-1">
                                  <Checkbox
                                    checked={selectedDishIds.has(dish.id)}
                                    onCheckedChange={() => toggleDishSelection(dish.id)}
                                    className="mt-1"
                                  />
                                  <div className="flex-1">
                                    <h3 className="text-lg font-semibold">{dish.name}</h3>
                                    {!dish.isActive && (
                                      <span className="text-muted-foreground text-xs">Inactive</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditDish(dish)}
                                    className="h-8 w-8 cursor-pointer p-0"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteDish(dish.id, dish.name)}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 cursor-pointer p-0"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                      {/* Description */}
                      {dish.description && (
                        <p className="text-muted-foreground line-clamp-2 text-sm">
                          {dish.description}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="space-y-2 border-t pt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Ingredients</span>
                          <span className="font-medium">{dish.recipeIngredients?.length || 0}</span>
                        </div>

                        {/* Cost - Always show */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t('menu.dish.cost')}</span>
                          <span
                            className={`font-medium ${cost === 0 ? 'text-muted-foreground' : ''}`}
                          >
                            €{cost.toFixed(2)}
                          </span>
                        </div>

                        {/* Selling Price - Always show */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {t('menu.dishWizard.sellingPrice')}
                          </span>
                          <span
                            className={`font-medium ${!sellingPrice ? 'text-muted-foreground' : ''}`}
                          >
                            {sellingPrice ? `€${sellingPrice.toFixed(2)}` : '-'}
                          </span>
                        </div>

                        {/* Margin - Show when both cost and selling price exist */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {t('menu.dishWizard.margin')}
                          </span>
                          {margin !== null && cost > 0 && sellingPrice ? (
                            <span
                              className={`font-semibold ${
                                margin > 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {margin.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau dossier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nom du dossier</label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Ex: Entrées, Plats principaux..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder();
                  }
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Couleur</label>
              <div className="flex gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewFolderColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      newFolderColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateFolder}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedDish && (
        <DishEditModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          dish={selectedDish}
          onSuccess={() => {
            loadDishes();
            setShowEditModal(false);
          }}
        />
      )}

      <DishQuickCreateFlow
        open={showQuickCreate}
        onOpenChange={(open) => {
          setShowQuickCreate(open);
          if (!open) {
            // Reload dishes when dialog closes
            loadDishes();
          }
        }}
      />
    </>
  );
}
