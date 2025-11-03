import { PageHeader } from '@/components/PageHeader';
import { getServerTranslation } from '@/lib/utils/language';
import { BarChart3, TrendingDown, Calendar, AlertTriangle, Shield, Leaf, Recycle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDLCInsights, getStockAdjustmentsInsights, getInventoryAccuracy, getByproductInsights } from '@/lib/queries/insights.queries';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

/**
 * Insights & History - Analytics Dashboard
 * "Vois ton impact sur le gaspillage"
 */
export const dynamic = 'force-dynamic';

export default async function InsightsPage() {
  const { t } = await getServerTranslation();

  // Fetch insights data
  const [dlcData, wasteData, accuracyData, byproductData] = await Promise.all([
    getDLCInsights(30),
    getStockAdjustmentsInsights(30),
    getInventoryAccuracy(30),
    getByproductInsights(30),
  ]);

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <PageHeader
        title={t('nav.insights')}
        subtitle="Vois ton impact sur le gaspillage"
        icon={BarChart3}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Waste Prevented by DLC Tracking */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gaspillage évité (30j)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {dlcData.summary.estimatedWastePrevented.toFixed(2)} €
                </div>
                <p className="text-xs text-muted-foreground">
                  Grâce au suivi DLC
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DLC Tracking Count */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Suivi DLC (30j)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {dlcData.summary.totalDLCs}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dlcData.summary.active} actifs • {dlcData.summary.used} utilisés
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actual Waste from Adjustments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pertes constatées (30j)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {wasteData.summary.totalWasteValue.toFixed(2)} €
                </div>
                <p className="text-xs text-muted-foreground">
                  {wasteData.summary.wasteAdjustments} ajustement{wasteData.summary.wasteAdjustments > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Impact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Impact net
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  +{(dlcData.summary.estimatedWastePrevented - wasteData.summary.totalWasteValue).toFixed(2)} €
                </div>
                <p className="text-xs text-muted-foreground">
                  Économies - Pertes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zero-Waste Hero Card - Always visible */}
      <Card className="relative border-2 border-green-400 overflow-hidden shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-shadow duration-1000">
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 via-emerald-400/10 to-teal-400/5 animate-pulse pointer-events-none" />
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 relative z-10">
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />
            Score Zéro Déchet
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 max-h-[80vh] overflow-y-auto" align="end">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Comment est calculé le score ?</h4>

                  <div className="space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      Le score est calculé simplement en 2 étapes :
                    </p>

                    <div className="space-y-3">
                      {/* Étape 1 */}
                      <div className="p-3 rounded bg-blue-50 border border-blue-200">
                        <div className="font-semibold text-blue-900 mb-2">📋 Étape 1 : Est-ce que vous suivez vos sous-produits ?</div>
                        <div className="text-xs text-blue-800 space-y-1">
                          <p>On compte combien de productions ont des sous-produits enregistrés.</p>
                          <div className="bg-white/50 p-2 rounded mt-2">
                            <strong>Exemple :</strong> Cette semaine vous avez fait 10 productions.
                            <br/>Pour 8 d'entre elles, vous avez noté les épluchures/os/parures.
                            <br/>→ <strong>80%</strong> de suivi (8÷10)
                          </div>
                        </div>
                      </div>

                      {/* Étape 2 */}
                      <div className="p-3 rounded bg-green-50 border border-green-200">
                        <div className="font-semibold text-green-900 mb-2">♻️ Étape 2 : Est-ce que vous les valorisez ?</div>
                        <div className="text-xs text-green-800 space-y-1">
                          <p>Parmi les sous-produits notés, combien sont réutilisés au lieu d'être jetés ?</p>
                          <div className="bg-white/50 p-2 rounded mt-2">
                            <strong>Exemple :</strong> Vous avez 15 sous-produits au total.
                            <br/>12 vont au compost/stock/réutilisation, 3 sont des déchets.
                            <br/>→ <strong>80%</strong> de valorisation (12÷15)
                          </div>
                        </div>
                      </div>

                      {/* Score final */}
                      <div className="p-3 rounded bg-gradient-to-r from-green-100 to-blue-100 border-2 border-green-300">
                        <div className="font-semibold text-green-900 mb-2">🎯 Score final</div>
                        <div className="text-xs space-y-2">
                          <div className="font-mono bg-white/70 p-2 rounded">
                            Score = (Étape 1 + Étape 2) ÷ 2
                            <br/>Score = (80% + 80%) ÷ 2 = <strong className="text-green-700">80%</strong>
                          </div>
                          <p className="text-green-800 italic">
                            Plus vous suivez et valorisez, meilleur est votre score !
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <h5 className="font-semibold text-sm mb-2 flex items-center gap-1">
                        🌍 Impact CO₂
                      </h5>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>
                          Le CO₂ économisé est calculé en convertissant les quantités en kg, puis :
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li><strong>Stock/Réutilisé :</strong> 0.5 kg CO₂/kg économisé (évite production)</li>
                          <li><strong>Compost :</strong> 0.3 kg CO₂/kg économisé (vs décharge)</li>
                        </ul>
                        <p className="pt-1 italic">
                          💡 Les comparaisons : 1 km en voiture ≈ 0.12 kg CO₂, 1 arbre absorbe ~22 kg CO₂/an
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </CardTitle>
          <CardDescription>
            Impact environnemental des sous-produits (30 derniers jours)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 relative z-10">
          {byproductData.summary.totalProductions > 0 ? (
            <>
              {/* Score principal avec dégradé */}
              <div className="text-center pb-6">
                <div className="inline-block relative">
                  <div className="text-7xl font-bold bg-gradient-to-br from-green-500 to-emerald-600 bg-clip-text text-transparent mb-2">
                    {byproductData.summary.zeroWasteScore.toFixed(0)}%
                  </div>
                  {byproductData.summary.zeroWasteScore >= 80 && (
                    <div className="absolute -top-2 -right-6 text-3xl animate-bounce">🌟</div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {byproductData.summary.productionsWithByproducts}/{byproductData.summary.totalProductions} productions suivies • {byproductData.summary.nonWasteByproducts}/{byproductData.summary.totalByproducts} valorisés
                </p>

                {/* Barre de progression */}
                <div className="max-w-xs mx-auto mt-4">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500 rounded-full"
                      style={{ width: `${byproductData.summary.zeroWasteScore}%` }}
                    />
                  </div>
                </div>

                {byproductData.summary.zeroWasteScore >= 80 && (
                  <p className="text-sm font-medium text-green-600 mt-3">
                    Excellent travail ! Champion du zéro déchet ! 🏆
                  </p>
                )}
                {byproductData.summary.zeroWasteScore >= 50 && byproductData.summary.zeroWasteScore < 80 && (
                  <p className="text-sm font-medium text-blue-600 mt-3">
                    Bon travail ! Continuez comme ça ! 💪
                  </p>
                )}
                {byproductData.summary.zeroWasteScore < 50 && (
                  <p className="text-sm font-medium text-orange-600 mt-3">
                    Vous pouvez faire mieux ! Enregistrez vos sous-produits 📝
                  </p>
                )}
              </div>

              {/* Répartition des types - Coloré mais élégant */}
              <div className="space-y-3 pt-6 border-t">
                <div className="text-xs font-medium text-muted-foreground mb-3">Répartition des sous-produits</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-green-100">
                        <Recycle className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-sm font-medium">Stock</span>
                    </div>
                    <span className="text-lg font-bold text-green-700">{byproductData.summary.byType.STOCK}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-amber-100">
                        <Leaf className="h-4 w-4 text-amber-600" />
                      </div>
                      <span className="text-sm font-medium">Compost</span>
                    </div>
                    <span className="text-lg font-bold text-amber-700">{byproductData.summary.byType.COMPOST}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-blue-100">
                        <Recycle className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium">Réutilisé</span>
                    </div>
                    <span className="text-lg font-bold text-blue-700">{byproductData.summary.byType.REUSE}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-br from-red-50 to-pink-50 border border-red-200">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-red-100">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      </div>
                      <span className="text-sm font-medium">Déchet</span>
                    </div>
                    <span className="text-lg font-bold text-red-700">{byproductData.summary.byType.WASTE}</span>
                  </div>
                </div>
              </div>

              {/* Potential estimation - Design simplifié */}
              {byproductData.summary.estimatedPotentialByproducts > 0 && byproductData.summary.totalByproducts < byproductData.summary.estimatedPotentialByproducts && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed bg-muted/30">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="text-xs text-muted-foreground">
                    <strong>+{byproductData.summary.estimatedPotentialByproducts - byproductData.summary.totalByproducts} sous-produits</strong> potentiels à capturer
                  </div>
                </div>
              )}

              {/* CO2 Impact Section - Plus attractif */}
              {byproductData.summary.co2Impact.totalCO2Saved > 0 && (
                <div className="pt-6 border-t">
                  <div className="text-xs font-medium text-muted-foreground mb-4">🌍 Impact environnemental</div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200 mb-4">
                    <div className="text-center">
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-4xl font-bold text-green-600">
                          {byproductData.summary.co2Impact.totalCO2Saved.toFixed(1)}
                        </span>
                        <span className="text-sm text-green-700 font-medium">kg CO₂</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">économisés grâce à vos efforts</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200">
                      <div className="text-3xl mb-2">🚗</div>
                      <div className="font-bold text-xl text-blue-700">
                        {byproductData.summary.co2Impact.kmInCar}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">km non parcourus</div>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-lime-50 border border-green-200">
                      <div className="text-3xl mb-2">🌳</div>
                      <div className="font-bold text-xl text-green-700">
                        {byproductData.summary.co2Impact.treesEquivalent}
                      </div>
                      <div className="text-xs text-green-600 mt-1">arbre{byproductData.summary.co2Impact.treesEquivalent > 1 ? 's' : ''} plantés</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 space-y-3">
              <div className="text-6xl mb-4">🌱</div>
              <h3 className="text-lg font-semibold text-green-800">Commencez votre parcours zéro déchet !</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Lors de votre prochaine production, pensez à enregistrer les sous-produits (os, épluchures, parures...)
                pour voir votre impact environnemental.
              </p>
              <div className="pt-4 text-xs text-muted-foreground">
                💡 Astuce : Allez dans <strong>Production</strong> et ajoutez des sous-produits après avoir préparé un plat
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top DLC Tracked Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Top 10 Produits Suivis (30 derniers jours)
          </CardTitle>
          <CardDescription>
            Produits avec le meilleur suivi DLC - gaspillage prévenu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dlcData.topTracked.length > 0 ? (
            <div className="space-y-3">
              {dlcData.topTracked.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between p-3 rounded-lg border bg-green-50/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{product.productName}</div>
                      <div className="text-xs text-muted-foreground">
                        {product.trackingCount} suivi{product.trackingCount > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      ~{(product.totalValue * 0.15).toFixed(2)} € économisé
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {product.totalQuantity.toFixed(1)} {product.unit} suivi
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun suivi DLC ces 30 derniers jours
            </p>
          )}
        </CardContent>
      </Card>

      {/* Top Wasted Products */}
      {wasteData.topWasted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Top 10 Produits Gaspillés (30 derniers jours)
            </CardTitle>
            <CardDescription>
              Produits avec les plus grandes pertes - à surveiller
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {wasteData.topWasted.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between p-3 rounded-lg border bg-red-50/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{product.productName}</div>
                      <div className="text-xs text-muted-foreground">
                        {product.count} perte{product.count > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">
                      -{product.totalValue.toFixed(2)} €
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {product.totalQuantity.toFixed(1)} {product.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Dishes with Byproducts - Zero Waste Champions */}
      {byproductData.topDishesWithByproducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-green-500" />
              Champions du Zéro Déchet (30 derniers jours)
            </CardTitle>
            <CardDescription>
              Plats avec le plus de sous-produits valorisés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {byproductData.topDishesWithByproducts.map((dish, index) => (
                <div
                  key={dish.dishName}
                  className="p-3 rounded-lg border bg-green-50/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="font-medium">{dish.dishName}</div>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                      {dish.byproductCount} sous-produit{dish.byproductCount > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="ml-11 space-y-1">
                    {dish.byproducts.map((bp, i) => (
                      <div key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="font-medium">{bp.name}</span>
                        <span>•</span>
                        <span>{bp.quantity} {bp.unit}</span>
                        <span>•</span>
                        <Badge variant="secondary" className="text-xs">
                          {bp.type === 'COMPOST' && '🌱 Compost'}
                          {bp.type === 'STOCK' && '📦 Stock'}
                          {bp.type === 'REUSE' && '♻️ Réutilisé'}
                          {bp.type === 'WASTE' && '🗑️ Déchet'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Common Byproducts */}
      {byproductData.topByproducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Recycle className="h-5 w-5 text-blue-500" />
              Sous-produits les Plus Fréquents (30 derniers jours)
            </CardTitle>
            <CardDescription>
              Les sous-produits que vous créez le plus souvent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {byproductData.topByproducts.map((bp, index) => (
                <div
                  key={bp.name}
                  className="flex items-center justify-between p-3 rounded-lg border bg-blue-50/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{bp.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {bp.count} fois • {bp.totalQuantity.toFixed(1)} {bp.unit} total
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {bp.types.map(type => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type === 'COMPOST' && '🌱'}
                        {type === 'STOCK' && '📦'}
                        {type === 'REUSE' && '♻️'}
                        {type === 'WASTE' && '🗑️'}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Frequently Adjusted Products */}
      {accuracyData.frequentlyAdjusted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Produits Nécessitant Attention
            </CardTitle>
            <CardDescription>
              Ajustements fréquents - vérifier le comptage ou les procédures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {accuracyData.frequentlyAdjusted.map((product) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between p-3 rounded-lg border bg-orange-50/50"
                >
                  <div className="font-medium">{product.productName}</div>
                  <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                    {product.adjustmentCount} ajustements
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Adjustments */}
      <Card>
        <CardHeader>
          <CardTitle>Ajustements Récents</CardTitle>
          <CardDescription>
            20 derniers ajustements d'inventaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {wasteData.recentAdjustments.map((movement) => {
              const isLoss = movement.quantity < 0;
              const absQuantity = Math.abs(movement.quantity);
              const absValue = Math.abs(movement.totalValue || 0);

              return (
                <div
                  key={movement.id}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                    isLoss ? 'bg-red-50/50 border-red-100' : 'bg-blue-50/50 border-blue-100'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{movement.product.name}</div>
                    <div className="text-muted-foreground">
                      {format(new Date(movement.createdAt), 'PPp', { locale: fr })}
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <div className={`font-bold ${isLoss ? 'text-red-600' : 'text-blue-600'}`}>
                      {isLoss ? '-' : '+'}{absQuantity.toFixed(1)} {movement.product.unit}
                    </div>
                    {movement.totalValue && (
                      <div className="text-muted-foreground">
                        {isLoss ? '-' : '+'}{absValue.toFixed(2)} €
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
