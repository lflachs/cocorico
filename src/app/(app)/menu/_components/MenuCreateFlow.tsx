'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PageHeader } from '@/components/PageHeader';
import { useLanguage } from '@/providers/LanguageProvider';
import { ChefHat, ArrowLeft, CheckCircle2, AlertCircle, DollarSign, ArrowRight, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Menu Create Flow - Step-by-step menu creation (like reception flow)
 * Flow: BASICS → PRICING → REVIEW → COMPLETE
 */

type FlowState = 'BASICS' | 'PRICING' | 'REVIEW' | 'SAVING';

type FormData = {
  name: string;
  description: string;
  isActive: boolean;
  pricingType: 'PRIX_FIXE' | 'CHOICE';
  fixedPrice?: number;
  numberOfCourses?: number;
};

type FormErrors = {
  name?: string;
  description?: string;
  fixedPrice?: string;
  numberOfCourses?: string;
};

export function MenuCreateFlow() {
  const router = useRouter();
  const { t } = useLanguage();
  const [state, setState] = useState<FlowState>('BASICS');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    isActive: true,
    pricingType: 'PRIX_FIXE',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: keyof FormData, value: any): string | undefined => {
    if (name === 'name') {
      if (!value || value.trim().length === 0) {
        return t('menu.menuForm.name') + ' is required';
      }
      if (value.trim().length < 2) {
        return 'Name must be at least 2 characters';
      }
      if (value.trim().length > 100) {
        return 'Name must be less than 100 characters';
      }
    }
    if (name === 'fixedPrice') {
      if (!value || value <= 0) {
        return 'Price must be greater than 0';
      }
    }
    if (name === 'numberOfCourses' && formData.pricingType === 'CHOICE') {
      if (!value || value <= 0) {
        return 'Number of courses must be at least 1';
      }
    }
    return undefined;
  };

  const handleFieldChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Validate on change if field was already touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleFieldBlur = (field: keyof FormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validate name
    const nameError = validateField('name', formData.name);
    if (nameError) {
      newErrors.name = nameError;
      isValid = false;
    }

    // Validate pricing fields - always validate fixed price
    const priceError = validateField('fixedPrice', formData.fixedPrice);
    if (priceError) {
      newErrors.fixedPrice = priceError;
      isValid = false;
    }

    if (formData.pricingType === 'CHOICE') {
      const coursesError = validateField('numberOfCourses', formData.numberOfCourses);
      if (coursesError) {
        newErrors.numberOfCourses = coursesError;
        isValid = false;
      }
    }

    setErrors(newErrors);
    setTouched({ name: true, description: true, fixedPrice: true, numberOfCourses: true });
    return isValid;
  };

  const handleNextFromBasics = () => {
    // Validate basics step
    const nameError = validateField('name', formData.name);
    if (nameError) {
      setErrors({ name: nameError });
      setTouched({ name: true });
      toast.error('Please enter a valid menu name');
      return;
    }

    setState('PRICING');
    toast.success('Step 1 complete!');
  };

  const handleNextFromPricing = () => {
    // Validate pricing step
    const priceError = validateField('fixedPrice', formData.fixedPrice);
    const coursesError = formData.pricingType === 'CHOICE'
      ? validateField('numberOfCourses', formData.numberOfCourses)
      : undefined;

    if (priceError || coursesError) {
      setErrors({ fixedPrice: priceError, numberOfCourses: coursesError });
      setTouched({ fixedPrice: true, numberOfCourses: true });
      toast.error('Please complete all pricing fields');
      return;
    }

    setState('REVIEW');
    toast.success('Step 2 complete!');
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before continuing');
      return;
    }

    setState('SAVING');
    try {
      const { createMenuAction } = await import('@/lib/actions/menu.actions');

      const result = await createMenuAction({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        isActive: formData.isActive,
        pricingType: formData.pricingType,
        fixedPrice: formData.fixedPrice,
        minCourses: formData.numberOfCourses,
        maxCourses: formData.numberOfCourses,
      });

      if (result.success) {
        toast.success(t('menu.update.success'));
        router.push('/menu');
      } else {
        toast.error(result.error || t('menu.update.error'));
        setState('REVIEW');
      }
    } catch (error) {
      console.error('Error creating menu:', error);
      toast.error(t('menu.update.error'));
      setState('REVIEW');
    }
  };

  const handleCancel = () => {
    router.push('/menu');
  };

  const handleBack = () => {
    if (state === 'PRICING') {
      setState('BASICS');
    } else if (state === 'REVIEW') {
      setState('PRICING');
    }
  };

  // Render based on state
  const renderContent = () => {
    // BASICS Step
    if (state === 'BASICS') {
      const isStepValid = !errors.name && formData.name.trim().length > 0;

      return (
        <Card>
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Progress indicator */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    1
                  </div>
                  <span className="font-medium text-foreground">Basic Information</span>
                </div>
                <ChevronRight className="w-4 h-4" />
                <div className="flex items-center gap-2 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-semibold">
                    2
                  </div>
                  <span>Pricing</span>
                </div>
                <ChevronRight className="w-4 h-4" />
                <div className="flex items-center gap-2 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-semibold">
                    3
                  </div>
                  <span>Review</span>
                </div>
              </div>

              {/* Menu Name */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="name" className="text-base font-semibold">
                    {t('menu.menuForm.name')} <span className="text-destructive">*</span>
                  </Label>
                  {touched.name && !errors.name && formData.name && (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  )}
                </div>
                <Input
                  id="name"
                  type="text"
                  placeholder={t('menu.menuForm.namePlaceholder')}
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  onBlur={() => handleFieldBlur('name')}
                  className={`text-base cursor-text ${
                    errors.name && touched.name
                      ? 'border-destructive focus-visible:ring-destructive'
                      : touched.name && formData.name
                      ? 'border-success focus-visible:ring-success'
                      : ''
                  }`}
                />
                {errors.name && touched.name ? (
                  <div className="flex items-start gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{errors.name}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('menu.create.nameHint')}
                  </p>
                )}
              </div>

              {/* Menu Description */}
              <div className="space-y-3">
                <Label htmlFor="description" className="text-base font-semibold">
                  {t('menu.menuForm.description')} <span className="text-muted-foreground text-sm">({t('menu.create.optional')})</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder={t('menu.menuForm.descriptionPlaceholder')}
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  onBlur={() => handleFieldBlur('description')}
                  rows={4}
                  className="text-base resize-none cursor-text"
                />
                <p className="text-sm text-muted-foreground">
                  {t('menu.create.descriptionHint')}
                </p>
              </div>

              {/* Active Status */}
              <div className="space-y-3">
                <Label htmlFor="isActive" className="text-base font-semibold">
                  {t('menu.create.statusTitle')}
                </Label>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-0.5">
                    <div className="font-medium">{t('menu.menuForm.isActive')}</div>
                    <p className="text-sm text-muted-foreground">
                      {t('menu.create.statusHint')}
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleFieldChange('isActive', checked)}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-4 mt-6 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleNextFromBasics}
                disabled={!isStepValid}
                className="gap-2 cursor-pointer"
              >
                Next: Pricing
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // PRICING Step
    if (state === 'PRICING') {
      const isPricingValid =
        formData.fixedPrice !== undefined && formData.fixedPrice > 0 &&
        (formData.pricingType === 'PRIX_FIXE' ||
         (formData.numberOfCourses !== undefined && formData.numberOfCourses > 0));

      return (
        <Card>
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Progress indicator */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-success text-success-foreground flex items-center justify-center font-semibold">
                    ✓
                  </div>
                  <span>Basic Information</span>
                </div>
                <ChevronRight className="w-4 h-4" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    2
                  </div>
                  <span className="font-medium text-foreground">Pricing</span>
                </div>
                <ChevronRight className="w-4 h-4" />
                <div className="flex items-center gap-2 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-semibold">
                    3
                  </div>
                  <span>Review</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{t('menu.pricing.title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('menu.pricing.subtitle')}</p>
                </div>
              </div>

              {/* Pricing Type */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  {t('menu.pricing.type')} <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('pricingType', 'PRIX_FIXE')}
                    className={`relative p-6 border-2 rounded-xl text-left transition-all cursor-pointer ${
                      formData.pricingType === 'PRIX_FIXE'
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                    }`}
                  >
                    {formData.pricingType === 'PRIX_FIXE' && (
                      <div className="absolute top-4 right-4">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="font-semibold text-lg">{t('menu.pricing.type.prixfixe')}</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {t('menu.pricing.type.prixfixe.description')}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFieldChange('pricingType', 'CHOICE')}
                    className={`relative p-6 border-2 rounded-xl text-left transition-all cursor-pointer ${
                      formData.pricingType === 'CHOICE'
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                    }`}
                  >
                    {formData.pricingType === 'CHOICE' && (
                      <div className="absolute top-4 right-4">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="font-semibold text-lg">{t('menu.pricing.type.choice')}</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {t('menu.pricing.type.choice.description')}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Pricing Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="fixedPrice" className="text-base font-semibold">
                    {t('menu.pricing.menuPrice')} (€) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">€</span>
                    <Input
                      id="fixedPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="45.00"
                      value={formData.fixedPrice || ''}
                      onChange={(e) => handleFieldChange('fixedPrice', parseFloat(e.target.value) || undefined)}
                      onBlur={() => handleFieldBlur('fixedPrice')}
                      className={`text-base cursor-text pl-8 ${
                        errors.fixedPrice && touched.fixedPrice ? 'border-destructive' : ''
                      }`}
                    />
                  </div>
                  {errors.fixedPrice && touched.fixedPrice && (
                    <div className="flex items-start gap-2 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4 mt-0.5" />
                      <span>{errors.fixedPrice}</span>
                    </div>
                  )}
                </div>

                {formData.pricingType === 'CHOICE' && (
                  <div className="space-y-3">
                    <Label htmlFor="numberOfCourses" className="text-base font-semibold">
                      {t('menu.pricing.numberOfCourses')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="numberOfCourses"
                      type="number"
                      min="1"
                      placeholder="2"
                      value={formData.numberOfCourses || ''}
                      onChange={(e) => handleFieldChange('numberOfCourses', parseInt(e.target.value) || undefined)}
                      onBlur={() => handleFieldBlur('numberOfCourses')}
                      className={`text-base cursor-text ${
                        errors.numberOfCourses && touched.numberOfCourses ? 'border-destructive' : ''
                      }`}
                    />
                    {errors.numberOfCourses && touched.numberOfCourses && (
                      <div className="flex items-start gap-2 text-sm text-destructive">
                        <AlertCircle className="w-4 h-4 mt-0.5" />
                        <span>{errors.numberOfCourses}</span>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {t('menu.pricing.numberOfCourses.hint')}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="gap-2 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>

                <Button
                  type="button"
                  onClick={handleNextFromPricing}
                  disabled={!isPricingValid}
                  className="gap-2 cursor-pointer"
                >
                  Next: Review
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // REVIEW Step
    if (state === 'REVIEW') {
      return (
        <Card>
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Progress indicator */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-success text-success-foreground flex items-center justify-center font-semibold">
                    ✓
                  </div>
                  <span>Basic Information</span>
                </div>
                <ChevronRight className="w-4 h-4" />
                <div className="flex items-center gap-2 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-success text-success-foreground flex items-center justify-center font-semibold">
                    ✓
                  </div>
                  <span>Pricing</span>
                </div>
                <ChevronRight className="w-4 h-4" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    3
                  </div>
                  <span className="font-medium text-foreground">Review</span>
                </div>
              </div>

              <div className="text-center space-y-2 mb-6">
                <ChefHat className="h-16 w-16 mx-auto text-primary" />
                <h2 className="text-2xl font-bold">Review Your Menu</h2>
                <p className="text-muted-foreground">Please confirm the details before creating</p>
              </div>

              {/* Summary */}
              <div className="space-y-4 bg-muted/30 rounded-lg p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Menu Name</p>
                    <p className="font-semibold">{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-semibold">{formData.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pricing Type</p>
                    <p className="font-semibold">
                      {formData.pricingType === 'PRIX_FIXE' ? t('menu.pricing.type.prixfixe') : t('menu.pricing.type.choice')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-semibold">€{formData.fixedPrice?.toFixed(2)}</p>
                  </div>
                  {formData.pricingType === 'CHOICE' && (
                    <div>
                      <p className="text-sm text-muted-foreground">Number of Courses</p>
                      <p className="font-semibold">{formData.numberOfCourses}</p>
                    </div>
                  )}
                </div>
                {formData.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm mt-1">{formData.description}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="gap-2 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  className="gap-2 cursor-pointer bg-gradient-to-br from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Create Menu
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // SAVING State
    if (state === 'SAVING') {
      return (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-6">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Creating Menu...</h2>
                <p className="text-muted-foreground">Please wait while we set up your menu</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={t('menu.menuForm.title.create')}
        subtitle={t('menu.create.subtitle')}
        icon={ChefHat}
      />
      {renderContent()}
    </div>
  );
}
