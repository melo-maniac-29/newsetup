import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Eye, 
  AlertTriangle,
  Shield,
  Flame,
  Waves,
  Zap,
  Sun
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { theme } from '@/constants/theme';
import { LocationConditions, DisasterRiskData } from '../../services/weatherApi';

interface WeatherDashboardProps {
  conditions: LocationConditions;
  onRefresh?: () => void;
}

export function WeatherDashboard({ conditions, onRefresh }: WeatherDashboardProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return theme.colors.danger;
      case 'high': return theme.colors.warning;
      case 'medium': return theme.colors.accent;
      case 'low': return theme.colors.success;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const getRiskVariant = (risk: string): 'danger' | 'warning' | 'accent' | 'success' => {
    switch (risk) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'accent';
      case 'low': return 'success';
      default: return 'accent';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Location Header */}
      <View style={styles.locationHeader}>
        <Text style={styles.locationTitle}>
          {conditions.location.name}, {conditions.location.region}
        </Text>
        <Text style={styles.locationSubtitle}>
          {conditions.location.country}
        </Text>
        <Text style={styles.lastUpdated}>
          Updated: {new Date(conditions.lastUpdated).toLocaleTimeString()}
        </Text>
      </View>

      {/* Weather Alerts */}
      {conditions.alerts.length > 0 && (
        <Card style={styles.alertsCard}>
          <View style={styles.alertsHeader}>
            <AlertTriangle color={theme.colors.danger} size={20} />
            <Text style={styles.alertsTitle}>Active Alerts</Text>
          </View>
          {conditions.alerts.map((alert: string, index: number) => (
            <View key={index} style={styles.alertItem}>
              <Text style={styles.alertText}>{alert}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* Current Weather */}
      <Card style={styles.weatherCard}>
        <Text style={styles.sectionTitle}>Current Weather</Text>
        <View style={styles.weatherGrid}>
          <View style={styles.weatherItem}>
            <Thermometer color={theme.colors.accent} size={20} />
            <Text style={styles.weatherValue}>{conditions.weather.temperature}°C</Text>
            <Text style={styles.weatherLabel}>Temperature</Text>
          </View>
          
          <View style={styles.weatherItem}>
            <Droplets color={theme.colors.accent} size={20} />
            <Text style={styles.weatherValue}>{conditions.weather.humidity}%</Text>
            <Text style={styles.weatherLabel}>Humidity</Text>
          </View>
          
          <View style={styles.weatherItem}>
            <Wind color={theme.colors.accent} size={20} />
            <Text style={styles.weatherValue}>{conditions.weather.windSpeed} m/s</Text>
            <Text style={styles.weatherLabel}>Wind Speed</Text>
          </View>
          
          <View style={styles.weatherItem}>
            <Eye color={theme.colors.accent} size={20} />
            <Text style={styles.weatherValue}>{conditions.weather.visibility} km</Text>
            <Text style={styles.weatherLabel}>Visibility</Text>
          </View>
        </View>
        
        <View style={styles.weatherDescription}>
          <Text style={styles.weatherMain}>{conditions.weather.weatherMain}</Text>
          <Text style={styles.weatherDesc}>{conditions.weather.weatherDescription}</Text>
        </View>
      </Card>

      {/* Disaster Risk Assessment */}
      <Card style={styles.riskCard}>
        <Text style={styles.sectionTitle}>Disaster Risk Assessment</Text>
        <View style={styles.riskGrid}>
          <RiskItem
            icon={<Waves color={getRiskColor(conditions.disasterRisks.flood)} size={20} />}
            label="Flood Risk"
            risk={conditions.disasterRisks.flood}
            variant={getRiskVariant(conditions.disasterRisks.flood)}
          />
          
          <RiskItem
            icon={<Flame color={getRiskColor(conditions.disasterRisks.heatWave)} size={20} />}
            label="Heat Wave Risk"
            risk={conditions.disasterRisks.heatWave}
            variant={getRiskVariant(conditions.disasterRisks.heatWave)}
          />
          
          <RiskItem
            icon={<Zap color={getRiskColor(conditions.disasterRisks.storm)} size={20} />}
            label="Storm Risk"
            risk={conditions.disasterRisks.storm}
            variant={getRiskVariant(conditions.disasterRisks.storm)}
          />
          
          <RiskItem
            icon={<Shield color={getRiskColor(conditions.disasterRisks.airPollution)} size={20} />}
            label="Air Pollution Risk"
            risk={conditions.disasterRisks.airPollution}
            variant={getRiskVariant(conditions.disasterRisks.airPollution)}
          />
          
          <RiskItem
            icon={<Sun color={getRiskColor(conditions.disasterRisks.heatWave)} size={20} />}
            label="Heat Wave Risk"
            risk={conditions.disasterRisks.heatWave}
            variant={getRiskVariant(conditions.disasterRisks.heatWave)}
          />
        </View>
      </Card>

      {/* Air Quality */}
      {conditions.airQuality && (
        <Card style={styles.airQualityCard}>
          <Text style={styles.sectionTitle}>Air Quality</Text>
          <View style={styles.airQualityContent}>
            <View style={styles.airQualityMain}>
              <Text style={styles.airQualityIndex}>
                AQI: {conditions.airQuality.aqi}
              </Text>
              <Badge 
                label={conditions.airQuality.status.toUpperCase()}
                variant={getRiskVariant(conditions.airQuality.status)}
                size="small"
              />
            </View>
            <View style={styles.airQualityDetails}>
              <Text style={styles.airQualityDetail}>
                PM2.5: {conditions.airQuality.pm2_5} μg/m³
              </Text>
              <Text style={styles.airQualityDetail}>
                PM10: {conditions.airQuality.pm10} μg/m³
              </Text>
            </View>
          </View>
        </Card>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

interface RiskItemProps {
  icon: React.ReactNode;
  label: string;
  risk: string;
  variant: 'danger' | 'warning' | 'accent' | 'success';
}

function RiskItem({ icon, label, risk, variant }: RiskItemProps) {
  return (
    <View style={styles.riskItem}>
      <View style={styles.riskIcon}>
        {icon}
      </View>
      <Text style={styles.riskLabel}>{label}</Text>
      <Badge 
        label={risk.toUpperCase()} 
        variant={variant}
        size="small"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  locationHeader: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
  },
  locationTitle: {
    ...theme.typography.h2,
    color: theme.colors.onBackground,
  },
  locationSubtitle: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.xs,
  },
  lastUpdated: {
    ...theme.typography.small,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.sm,
  },
  alertsCard: {
    margin: theme.spacing.md,
    backgroundColor: `${theme.colors.danger}10`,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.danger,
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  alertsTitle: {
    ...theme.typography.h3,
    color: theme.colors.danger,
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
  },
  alertItem: {
    marginBottom: theme.spacing.sm,
  },
  alertText: {
    ...theme.typography.body,
    color: theme.colors.danger,
    fontWeight: '500',
  },
  weatherCard: {
    margin: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.md,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  weatherItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  weatherValue: {
    ...theme.typography.h3,
    color: theme.colors.accent,
    marginTop: theme.spacing.xs,
    fontWeight: '700',
  },
  weatherLabel: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.xs,
  },
  weatherDescription: {
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.md,
  },
  weatherMain: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
  },
  weatherDesc: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.xs,
    textTransform: 'capitalize',
  },
  riskCard: {
    margin: theme.spacing.md,
  },
  riskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  riskItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  riskIcon: {
    marginBottom: theme.spacing.sm,
  },
  riskLabel: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  airQualityCard: {
    margin: theme.spacing.md,
  },
  airQualityContent: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  airQualityMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  airQualityIndex: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    fontWeight: '600',
  },
  airQualityDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  airQualityDetail: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
});

export default WeatherDashboard;