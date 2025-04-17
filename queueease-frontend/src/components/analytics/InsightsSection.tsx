import React, { useMemo } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Divider, 
  Chip, useTheme, List, ListItem, ListItemIcon, 
  ListItemText, alpha, Paper
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RecommendIcon from '@mui/icons-material/Recommend';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import TimerIcon from '@mui/icons-material/Timer';
import PeopleIcon from '@mui/icons-material/People';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import SpeedIcon from '@mui/icons-material/Speed';
import BugReportIcon from '@mui/icons-material/BugReport';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RepeatIcon from '@mui/icons-material/Repeat';
import { InsightsSectionProps, InsightItem } from 'types/analyticsTypes';

const InsightsSection: React.FC<InsightsSectionProps> = ({
  analyticsData,
  timeRange
}) => {
  const theme = useTheme();

  // Helper function to get color based on severity
  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'positive':
        return theme.palette.success.main;
      case 'negative':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      default:
        return theme.palette.info.main;
    }
  };

  // Reusable card component for insights
  const renderInsightCard = (insight: InsightItem) => {
    const color = getSeverityColor(insight.severity);
    
    return (
      <Card 
        key={insight.id}
        sx={{ 
          mb: 3, 
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
          border: '1px solid',
          borderColor: alpha(color, 0.3),
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.12)'
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(color, 0.1),
                color: color,
                p: 1,
                borderRadius: 2,
                mr: 2
              }}
            >
              {insight.icon || (
                insight.severity === 'positive' ? <CheckCircleIcon /> :
                insight.severity === 'negative' ? <ErrorOutlineIcon /> :
                insight.severity === 'warning' ? <WarningIcon /> :
                <RecommendIcon />
              )}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="600">
                {insight.title}
              </Typography>
              {insight.metric && (
                <Chip 
                  label={insight.metric} 
                  size="small"
                  sx={{ 
                    bgcolor: alpha(color, 0.1),
                    color: color,
                    fontWeight: 'medium',
                    mt: 0.5
                  }}
                />
              )}
            </Box>
          </Box>
          
          <Typography variant="body1" paragraph>
            {insight.description}
          </Typography>
          
          {insight.recommendations && insight.recommendations.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AssignmentTurnedInIcon sx={{ fontSize: 20, mr: 1 }} />
                  Recommended Actions:
                </Box>
              </Typography>
              <List disablePadding dense>
                {insight.recommendations.map((rec, idx) => (
                  <ListItem key={idx} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <Box 
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          bgcolor: alpha(color, 0.1),
                          color: color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {idx + 1}
                      </Box>
                    </ListItemIcon>
                    <ListItemText 
                      primary={rec} 
                      primaryTypographyProps={{ 
                        variant: 'body2', 
                        sx: { fontWeight: '400' } 
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  // Generate insights based on analytics data
  const insights = useMemo(() => {
    const result: InsightItem[] = [];
    if (!analyticsData) return result;
    
    // Extract analytics data
    const {
      satisfied_pct,
      neutral_pct,
      dissatisfied_pct,
      average_wait_time,
      feedback_distribution,
      customer_comments,
      satisfaction_trend,
      wait_time_trend,
      total_reports,
      feedback_keywords
    } = analyticsData;
    
    // Handle no data scenario
    if (total_reports === 0 || (feedback_distribution && feedback_distribution.length === 0)) {
      result.push({
        id: 'no-data',
        title: 'Insufficient Data for Analysis',
        description: 'There is not enough feedback data available to generate meaningful insights.',
        severity: 'neutral',
        icon: <InfoIcon />,
        recommendations: [
          'Encourage customers to provide feedback',
          'Consider implementing a feedback incentive program',
          'Ensure that feedback collection is working properly',
          'Set up automated feedback requests after service completion'
        ]
      });
      return result;
    }

    // INSIGHT GROUP 1: Customer Satisfaction Trend Analysis
    if (satisfaction_trend && satisfaction_trend.length > 1) {
      // Get metrics for analysis
      const trendLength = satisfaction_trend.length;
      const currentSatisfaction = satisfaction_trend[trendLength - 1];
      const previousSatisfaction = satisfaction_trend[trendLength - 2];
      
      // Calculate period-to-period change
      const difference = currentSatisfaction - previousSatisfaction;
      
      // Calculate overall trend from first to latest data point
      const firstSatisfaction = satisfaction_trend[0];
      const overallDifference = currentSatisfaction - firstSatisfaction;
      
      // Calculate volatility using standard deviation
      const average = satisfaction_trend.reduce((sum, val) => sum + val, 0) / trendLength;
      const squaredDiffs = satisfaction_trend.map(val => Math.pow(val - average, 2));
      const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / trendLength;
      const volatility = Math.sqrt(variance);
      
      // Detect momentum using last three periods
      let momentum = 'neutral';
      if (trendLength >= 3) {
        const period3 = satisfaction_trend[trendLength - 1];
        const period2 = satisfaction_trend[trendLength - 2];
        const period1 = satisfaction_trend[trendLength - 3];
        
        const change2to3 = period3 - period2;
        const change1to2 = period2 - period1;
        
        // Determine momentum direction based on changes between periods
        if (change2to3 > 0 && change1to2 > 0) {
          momentum = 'accelerating_positive';
        } else if (change2to3 > 0 && change1to2 <= 0) {
          momentum = 'reversal_positive';
        } else if (change2to3 < 0 && change1to2 < 0) {
          momentum = 'accelerating_negative';
        } else if (change2to3 < 0 && change1to2 >= 0) {
          momentum = 'reversal_negative';
        } else if (Math.abs(change2to3) < 2) {
          momentum = 'stable';
        }
      }
      
      // Add insight for significant period-to-period change (>=5%)
      if (Math.abs(difference) >= 5) {
        const isPositive = difference > 0;
        result.push({
          id: 'satisfaction-trend-recent',
          title: isPositive ? 'Satisfaction Trending Up' : 'Satisfaction Trending Down',
          description: isPositive
            ? `Customer satisfaction has increased by ${difference.toFixed(1)}% compared to the previous period.`
            : `Customer satisfaction has decreased by ${Math.abs(difference).toFixed(1)}% compared to the previous period.`,
          severity: isPositive ? 'positive' : 'negative',
          metric: `${Math.abs(difference).toFixed(1)}%`,
          change: isPositive ? 'increase' : 'decrease',
          icon: isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />,
          recommendations: isPositive
            ? [
                'Continue the practices that are working well',
                'Acknowledge staff for improved service quality',
                'Consider documenting what changed during this period for future reference',
                'Set up a system to monitor if the improvement is maintained'
              ]
            : [
                'Review recent operational changes that might have affected service quality',
                'Collect more detailed feedback from customers through targeted surveys',
                'Consider additional staff training in areas with low satisfaction',
                'Hold a team meeting to discuss potential causes and solutions'
              ]
        });
      } 
      // Add insight for stable satisfaction
      else if (Math.abs(difference) < 2 && trendLength > 2) {
        result.push({
          id: 'satisfaction-trend-stable',
          title: 'Satisfaction Remains Stable',
          description: `Customer satisfaction has remained relatively stable with only a ${difference > 0 ? 'slight increase' : 'slight decrease'} of ${Math.abs(difference).toFixed(1)}%.`,
          severity: 'neutral',
          icon: <TrendingFlatIcon />,
          metric: `${currentSatisfaction.toFixed(1)}%`,
          recommendations: currentSatisfaction >= 75
            ? [
                'Maintain current service practices that are keeping satisfaction high',
                'Look for small improvements to push satisfaction even higher',
                'Document current processes for training new staff'
              ]
            : [
                'While stability is good, current satisfaction levels have room for improvement',
                'Identify specific areas that could be enhanced to boost ratings',
                'Consider implementing a new service initiative to break through the plateau'
              ]
        });
      }
      
      // Add insight based on momentum if there's a clear pattern
      if (momentum !== 'neutral' && trendLength >= 3) {
        // Different insights based on momentum type
        if (momentum === 'accelerating_positive') {
          result.push({
            id: 'satisfaction-momentum-positive',
            title: 'Accelerating Positive Satisfaction Trend',
            description: 'Customer satisfaction is showing consistent improvement with increasing momentum over the last three periods.',
            severity: 'positive',
            icon: <SpeedIcon />,
            recommendations: [
              'Identify and reinforce the factors driving this positive momentum',
              'Share success metrics with all staff to maintain motivation',
              'Document recent changes in procedures or staffing that may contribute to this trend',
              'Consider case studies of what is working well for training purposes'
            ]
          });
        } else if (momentum === 'accelerating_negative') {
          result.push({
            id: 'satisfaction-momentum-negative',
            title: 'Satisfaction Declining at Increasing Rate',
            description: 'Customer satisfaction has been declining with increasing momentum over the last three periods, suggesting a systemic issue that needs attention.',
            severity: 'negative',
            icon: <BugReportIcon />,
            recommendations: [
              'Conduct an urgent service quality review to identify root causes',
              'Implement immediate measures to address customer concerns',
              'Consider a temporary increase in staffing or resources in problem areas',
              'Hold daily stand-up meetings to address issues until the trend reverses'
            ]
          });
        } else if (momentum === 'reversal_positive') {
          result.push({
            id: 'satisfaction-momentum-reversal-positive',
            title: 'Satisfaction Trend Reversal (Positive)',
            description: 'After a previous decline, customer satisfaction has begun to improve, indicating recent changes may be having positive effects.',
            severity: 'positive',
            icon: <TrendingUpIcon />,
            recommendations: [
              'Analyse recent changes that may have contributed to this reversal',
              'Reinforce and expand successful initiatives',
              'Monitor closely to ensure the positive trend continues',
              'Acknowledge team members who helped implement improvements'
            ]
          });
        } else if (momentum === 'reversal_negative') {
          result.push({
            id: 'satisfaction-momentum-reversal-negative',
            title: 'Satisfaction Trend Reversal (Negative)',
            description: 'After previous improvements, customer satisfaction has begun to decline, indicating potential new issues.',
            severity: 'warning',
            icon: <WarningIcon />,
            recommendations: [
              'Investigate what factors have changed since the previous positive trend',
              'Gather feedback from frontline staff about recent challenges',
              'Review any new procedures or changes that coincide with the decline',
              'Consider reverting recent changes that may have negatively impacted service'
            ]
          });
        }
      }
      
      // Add insight for significant overall trend (>=10% change)
      if (Math.abs(overallDifference) >= 10 && trendLength >= 3) {
        result.push({
          id: 'satisfaction-trend-overall',
          title: overallDifference > 0 ? 'Long-term Satisfaction Improvement' : 'Long-term Satisfaction Decline',
          description: overallDifference > 0
            ? `Customer satisfaction has improved by ${overallDifference.toFixed(1)}% over the ${timeRange} period, showing sustained progress.`
            : `Customer satisfaction has declined by ${Math.abs(overallDifference).toFixed(1)}% over the ${timeRange} period, indicating persistent issues.`,
          severity: overallDifference > 0 ? 'positive' : 'negative',
          icon: overallDifference > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />,
          recommendations: overallDifference > 0
            ? [
                'Document the successful strategies implemented during this period',
                'Consider extending successful approaches to other areas of service',
                'Recognise staff for sustained improvements',
                'Set new targets for continued improvement'
              ]
            : [
                'Conduct a comprehensive review of service processes',
                'Consider restructuring problematic service areas',
                'Develop a detailed improvement plan with clear milestones',
                'Increase management oversight in areas showing consistent problems'
              ]
        });
      }
      
      // Add insight for high volatility
      if (volatility > 8 && trendLength >= 4) {
        result.push({
          id: 'satisfaction-volatility',
          title: 'High Satisfaction Volatility Detected',
          description: `Customer satisfaction shows significant fluctuations with a volatility index of ${volatility.toFixed(1)}, indicating inconsistent service experiences.`,
          severity: 'warning',
          icon: <RepeatIcon />,
          recommendations: [
            'Focus on standardising service procedures to improve consistency',
            'Investigate whether volatility correlates with specific days, shifts, or staff members',
            'Implement more detailed service standards and checklists',
            'Consider scheduling adjustments if volatility relates to staffing levels',
            'Provide additional training for consistent service delivery'
          ]
        });
      }
    }

    // INSIGHT GROUP 2: Wait Time Analysis
    if (average_wait_time !== undefined) {
      // Define wait time thresholds for analysis in minutes
      const criticalWaitThreshold = 25;
      const highWaitThreshold = 15;
      const optimalWaitThreshold = 10;
      const lowWaitThreshold = 5;
      
      // Generate insights based on wait time thresholds
      if (average_wait_time >= criticalWaitThreshold) {
        // Critical wait times
        result.push({
          id: 'wait-time-critical',
          title: 'Critical Wait Time Issues',
          description: `Average wait time of ${average_wait_time} minutes is significantly above acceptable thresholds and likely impacting customer satisfaction.`,
          severity: 'negative',
          metric: `${average_wait_time} min`,
          icon: <TimerIcon />,
          recommendations: [
            'Consider this a high-priority operational issue requiring immediate intervention',
            'Conduct a full service workflow analysis to identify bottlenecks',
            'Implement an "all hands" approach during peak times',
            'Review and potentially revise staffing levels and scheduling',
            'Consider implementing a triage system for service prioritisation'
          ]
        });
      } else if (average_wait_time >= highWaitThreshold && average_wait_time < criticalWaitThreshold) {
        // High wait times
        result.push({
          id: 'wait-time-high',
          title: 'High Wait Times Detected',
          description: `Average wait time of ${average_wait_time} minutes exceeds recommended threshold of ${highWaitThreshold} minutes.`,
          severity: 'negative',
          metric: `${average_wait_time} min`,
          icon: <TimerIcon />,
          recommendations: [
            'Add additional staff during identified peak hours',
            'Review service delivery procedures for efficiency opportunities',
            'Optimise the queuing system algorithm and parameters',
            'Improve communication with waiting customers to manage expectations',
            'Consider implementing a notification system so customers don\'t need to wait in person'
          ]
        });
      } else if (average_wait_time >= optimalWaitThreshold && average_wait_time < highWaitThreshold) {
        // Moderate wait times
        result.push({
          id: 'wait-time-moderate',
          title: 'Acceptable but Improvable Wait Times',
          description: `Average wait time of ${average_wait_time} minutes is within acceptable limits but could be improved.`,
          severity: 'neutral',
          metric: `${average_wait_time} min`,
          icon: <AccessTimeIcon />,
          recommendations: [
            'Fine-tune service delivery to shave 1-2 minutes off average processing time',
            'Analyse whether wait times differ significantly by time of day or day of week',
            'Implement small process improvements that don\'t require major changes',
            'Consider training staff on efficient service techniques'
          ]
        });
      } else if (average_wait_time >= lowWaitThreshold && average_wait_time < optimalWaitThreshold) {
        // Optimal wait times
        result.push({
          id: 'wait-time-optimal',
          title: 'Optimal Wait Times',
          description: `Average wait time of ${average_wait_time} minutes is within the optimal range for customer satisfaction.`,
          severity: 'positive',
          metric: `${average_wait_time} min`,
          icon: <CheckCircleIcon />,
          recommendations: [
            'Maintain current service pace and procedures',
            'Document current workflows for training purposes',
            'Consider highlighting short wait times in customer communications',
            'Periodically check staff-to-customer ratios to ensure continued efficiency'
          ]
        });
      } else if (average_wait_time < lowWaitThreshold) {
        // Very low wait times
        result.push({
          id: 'wait-time-very-low',
          title: 'Exceptionally Low Wait Times',
          description: `Average wait time of ${average_wait_time} minutes is below industry averages and may indicate potential resource optimisation opportunities.`,
          severity: 'positive',
          metric: `${average_wait_time} min`,
          icon: <CheckCircleIcon />,
          recommendations: [
            'Consider this a competitive advantage in your marketing',
            'Evaluate whether current staffing levels are cost-efficient',
            'Consider whether some staff could be reallocated to other service areas',
            'Monitor customer satisfaction to ensure quality isn\'t being sacrificed for speed'
          ]
        });
      }
      
      // Analyse wait time trends if data available
      if (wait_time_trend && wait_time_trend.length > 2) {
        const latestWaitTime = wait_time_trend[wait_time_trend.length - 1];
        const previousWaitTime = wait_time_trend[wait_time_trend.length - 2];
        const waitTimeDifference = latestWaitTime - previousWaitTime;
        
        // Significant increase in wait times
        if (waitTimeDifference >= 5) {
          result.push({
            id: 'wait-time-increasing',
            title: 'Wait Times Trending Upward',
            description: `Wait times have increased by ${waitTimeDifference.toFixed(1)} minutes compared to the previous period, potentially indicating emerging operational issues.`,
            severity: 'warning',
            icon: <TrendingUpIcon />,
            metric: `+${waitTimeDifference.toFixed(1)} min`,
            recommendations: [
              'Investigate what operational changes coincide with this increase',
              'Check if the increase correlates with higher customer volume',
              'Review recent staffing changes or absences',
              'Proactively address the trend before it impacts customer satisfaction'
            ]
          });
        } 
        // Significant decrease in wait times
        else if (waitTimeDifference <= -5) {
          result.push({
            id: 'wait-time-decreasing',
            title: 'Wait Times Improving',
            description: `Wait times have decreased by ${Math.abs(waitTimeDifference).toFixed(1)} minutes compared to the previous period.`,
            severity: 'positive',
            icon: <TrendingDownIcon />,
            metric: `${Math.abs(waitTimeDifference).toFixed(1)} min`,
            recommendations: [
              'Identify what operational changes led to this improvement',
              'Document successful processes for consistent implementation',
              'Acknowledge staff members who contributed to the improvement',
              'Continue monitoring to ensure the positive trend is maintained'
            ]
          });
        }
      }
    }

    // INSIGHT GROUP 3: Feedback Category Analysis
    if (feedback_distribution && feedback_distribution.length > 0) {
      // Sort categories by volume for context
      const totalFeedbackByCategory = [...feedback_distribution]
        .sort((a, b) => (b.satisfied + b.neutral + b.dissatisfied) - (a.satisfied + a.neutral + a.dissatisfied));
      
      // Calculate overall metrics for context
      const totalFeedbackVolume = totalFeedbackByCategory.reduce((sum, cat) => 
        sum + (cat.satisfied + cat.neutral + cat.dissatisfied), 0);
      
      const avgDissatisfaction = totalFeedbackByCategory.reduce((sum, cat) => 
        sum + cat.dissatisfied, 0) / totalFeedbackByCategory.length;
        
      const avgSatisfaction = totalFeedbackByCategory.reduce((sum, cat) => 
        sum + cat.satisfied, 0) / totalFeedbackByCategory.length;
        
      // Find categories with different satisfaction levels
      const criticalCategories = feedback_distribution
        .filter(item => item.dissatisfied >= 40)
        .sort((a, b) => b.dissatisfied - a.dissatisfied);
      
      const highProblemCategories = feedback_distribution
        .filter(item => item.dissatisfied >= 30 && item.dissatisfied < 40)
        .sort((a, b) => b.dissatisfied - a.dissatisfied);
      
      const moderateProblemCategories = feedback_distribution
        .filter(item => item.dissatisfied >= 20 && item.dissatisfied < 30)
        .sort((a, b) => b.dissatisfied - a.dissatisfied);
      
      const exceptionalCategories = feedback_distribution
        .filter(item => item.satisfied >= 80)
        .sort((a, b) => b.satisfied - a.satisfied);
      
      const veryGoodCategories = feedback_distribution
        .filter(item => item.satisfied >= 70 && item.satisfied < 80)
        .sort((a, b) => b.satisfied - a.satisfied);
      
      const highNeutralCategories = feedback_distribution
        .filter(item => item.neutral >= 40)
        .sort((a, b) => b.neutral - a.neutral);
        
      const polarisedCategories = feedback_distribution
        .filter(item => item.satisfied >= 40 && item.dissatisfied >= 20)
        .sort((a, b) => (b.satisfied + b.dissatisfied) - (a.satisfied + a.dissatisfied));
      
      // Add insights based on category analysis
      
      // Critical problem categories
      if (criticalCategories.length > 0) {
        const categoryNames = criticalCategories.map(cat => `"${cat.category}"`).join(', ');
        const worstCategory = criticalCategories[0];
        
        result.push({
          id: 'critical-problem-categories',
          title: 'Critical Service Issues Detected',
          description: `${categoryNames} ${criticalCategories.length === 1 ? 'has a' : 'have'} critically high dissatisfaction rate ${criticalCategories.length === 1 ? 'of' : 'averaging'} ${worstCategory.dissatisfied}%.`,
          severity: 'negative',
          metric: `${worstCategory.category}: ${worstCategory.dissatisfied}% dissatisfied`,
          icon: <ErrorOutlineIcon />,
          recommendations: [
            `Conduct an urgent review of ${criticalCategories.length === 1 ? 'this category' : 'these categories'}`,
            'Implement immediate staff training to address identified issues',
            'Consider temporary procedural changes until improvements take effect',
            'Schedule focused meetings with team leaders responsible for these areas'
          ]
        });
      }
      
      // High problem categories
      if (highProblemCategories.length > 0) {
        const categoryNames = highProblemCategories.map(cat => `"${cat.category}"`).join(', ');
        
        result.push({
          id: 'high-problem-categories',
          title: 'Service Areas Needing Significant Attention',
          description: `${categoryNames} ${highProblemCategories.length === 1 ? 'has' : 'have'} high dissatisfaction rates that require prompt attention.`,
          severity: 'warning',
          metric: `${highProblemCategories.length} high-risk ${highProblemCategories.length === 1 ? 'area' : 'areas'}`,
          icon: <WarningIcon />,
          recommendations: [
            `Schedule targeted training sessions for staff handling ${categoryNames}`,
            'Collect more detailed feedback about these specific areas',
            'Implement interim service improvements while developing long-term solutions',
            'Monitor these metrics weekly to track improvement progress'
          ]
        });
      }
      
      // Moderate problem categories
      if (moderateProblemCategories.length > 0 && criticalCategories.length === 0 && highProblemCategories.length === 0) {
        const categoryNames = moderateProblemCategories.map(cat => `"${cat.category}"`).join(', ');
        
        result.push({
          id: 'moderate-problem-categories',
          title: 'Service Areas to Monitor',
          description: `${categoryNames} ${moderateProblemCategories.length === 1 ? 'shows' : 'show'} moderate dissatisfaction levels that should be addressed preventatively.`,
          severity: 'warning',
          icon: <WarningIcon />,
          recommendations: [
            'Implement targeted improvements in these areas before issues escalate',
            'Gather more detailed customer feedback to understand specific pain points',
            'Provide refresher training for staff handling these categories',
            'Consider subtle adjustments to service procedures'
          ]
        });
      }
      
      // Exceptional categories
      if (exceptionalCategories.length > 0) {
        const categoryNames = exceptionalCategories.map(cat => `"${cat.category}"`).join(', ');
        const bestCategory = exceptionalCategories[0];
        
        result.push({
          id: 'exceptional-categories',
          title: 'Service Areas Excelling',
          description: `${categoryNames} ${exceptionalCategories.length === 1 ? 'has an' : 'have'} exceptionally high satisfaction rate ${exceptionalCategories.length === 1 ? 'of' : 'averaging'} ${bestCategory.satisfied}%.`,
          severity: 'positive',
          metric: `${bestCategory.category}: ${bestCategory.satisfied}% satisfied`,
          icon: <SentimentSatisfiedAltIcon />,
          recommendations: [
            `Recognise and reward staff involved in ${categoryNames}`,
            'Document specific practices in these areas for training materials',
            'Consider featuring these service strengths in marketing materials',
            'Create case studies of successful approaches for wider implementation'
          ]
        });
      }
      
      // Very good categories
      if (veryGoodCategories.length > 0 && exceptionalCategories.length === 0) {
        const categoryNames = veryGoodCategories.map(cat => `"${cat.category}"`).join(', ');
        
        result.push({
          id: 'very-good-categories',
          title: 'Strong Service Areas',
          description: `${categoryNames} ${veryGoodCategories.length === 1 ? 'shows' : 'show'} very good satisfaction ratings with potential for excellence.`,
          severity: 'positive',
          icon: <CheckCircleIcon />,
          recommendations: [
            'Maintain the current high standards in these areas',
            'Identify specific elements that could push these categories to exceptional ratings',
            'Use these categories as examples of good service delivery',
            'Consider small refinements to service approaches in these areas'
          ]
        });
      }
      
      // High neutrality categories
      if (highNeutralCategories.length > 0) {
        const categoryNames = highNeutralCategories.map(cat => `"${cat.category}"`).join(', ');
        const highestNeutralCategory = highNeutralCategories[0];
        
        result.push({
          id: 'high-neutral-categories',
          title: 'Service Areas with Ambiguous Perception',
          description: `${categoryNames} ${highNeutralCategories.length === 1 ? 'has' : 'have'} unusually high neutral ratings (${highestNeutralCategory.neutral}%), indicating potential customer indifference or mixed experiences.`,
          severity: 'neutral',
          icon: <InfoIcon />,
          recommendations: [
            'Conduct targeted surveys to better understand neutral responses',
            'Look for ways to make the service experience more distinctly positive',
            'Review service delivery in these areas for inconsistencies',
            'Consider service innovations that might elevate customer perception'
          ]
        });
      }
      
      // Polarised categories
      if (polarisedCategories.length > 0) {
        const categoryNames = polarisedCategories.map(cat => `"${cat.category}"`).join(', ');
        
        result.push({
          id: 'polarised-categories',
          title: 'Service Areas with Inconsistent Experiences',
          description: `${categoryNames} ${polarisedCategories.length === 1 ? 'shows' : 'show'} highly polarised feedback, with both high satisfaction and high dissatisfaction rates.`,
          severity: 'warning',
          icon: <RepeatIcon />,
          recommendations: [
            'Investigate the cause of inconsistent experiences in these areas',
            'Check if polarisation correlates with specific staff members or shifts',
            'Standardise service procedures to ensure consistent delivery',
            'Implement quality control measures'
          ]
        });
      }
      
      // Overall distribution profile
      if (criticalCategories.length === 0 && 
          highProblemCategories.length === 0 && 
          exceptionalCategories.length === 0 && 
          veryGoodCategories.length === 0 &&
          polarisedCategories.length === 0 &&
          highNeutralCategories.length === 0) {
        
        // Determine overall distribution profile
        if (avgSatisfaction >= 60 && avgDissatisfaction <= 20) {
          result.push({
            id: 'overall-distribution-positive',
            title: 'Balanced Positive Feedback Distribution',
            description: 'Feedback across categories shows a healthy distribution with good satisfaction levels and no critical problem areas.',
            severity: 'positive',
            icon: <CheckCircleIcon />,
            recommendations: [
              'Maintain current service standards across all categories',
              'Consider incremental improvements to elevate good ratings to excellent',
              'Continue monitoring for any emerging trends or shifts',
              'Ensure staff training maintains consistent service quality'
            ]
          });
        } else if (avgSatisfaction >= 40 && avgSatisfaction < 60 && avgDissatisfaction < 30) {
          result.push({
            id: 'overall-distribution-neutral',
            title: 'Balanced Neutral Feedback Distribution',
            description: 'Feedback across categories shows a moderate satisfaction level with room for improvement.',
            severity: 'neutral',
            icon: <InfoIcon />,
            recommendations: [
              'Focus on moving neutral customers to satisfied through service enhancements',
              'Identify common themes that might be keeping satisfaction from reaching higher levels',
              'Consider refreshing service approaches across categories',
              'Implement small but noticeable service improvements'
            ]
          });
        } else if (avgDissatisfaction >= 30) {
          result.push({
            id: 'overall-distribution-concerning',
            title: 'Generally Concerning Feedback Distribution',
            description: 'Feedback shows moderately high dissatisfaction across multiple categories without any single critical area.',
            severity: 'warning',
            icon: <WarningIcon />,
            recommendations: [
              'Conduct a broad service quality review across all categories',
              'Implement a comprehensive staff training refresh',
              'Consider revising service standards and expectations',
              'Develop an improvement plan with specific targets for each category'
            ]
          });
        }
      }
    }

    // INSIGHT GROUP 4: Comment Analysis
    if (customer_comments && customer_comments.length > 0) {
      // Calculate sentiment distribution
      const positiveComments = customer_comments.filter(c => c.rating >= 4).length;
      const negativeComments = customer_comments.filter(c => c.rating <= 2).length;
      const neutralComments = customer_comments.filter(c => c.rating === 3).length;
      const totalComments = customer_comments.length;
      
      // Calculate ratios
      const positiveRatio = positiveComments / totalComments;
      const negativeRatio = negativeComments / totalComments;
      const neutralRatio = neutralComments / totalComments;
      
      // Analysis of comment quality and patterns
      const commentsWithText = customer_comments.filter(c => c.comment && c.comment.trim().length > 0);
      const commentsWithTextRatio = commentsWithText.length / totalComments;
      
      const avgCommentLength = commentsWithText.length > 0
        ? commentsWithText.reduce((sum, c) => sum + c.comment.length, 0) / commentsWithText.length
        : 0;
      
      // Check for recent comments (within 7 days)
      const recentComments = customer_comments.filter(c => {
        const commentDate = new Date(c.date);
        const now = new Date();
        const daysAgo = Math.floor((now.getTime() - commentDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysAgo <= 7;
      });
      
      const recentCommentsRatio = recentComments.length / totalComments;
      
      // Determine comment trend
      let commentTrend = 'stable';
      if (recentComments.length >= 3) {
        const recentPositiveRatio = recentComments.filter(c => c.rating >= 4).length / recentComments.length;
        const olderComments = customer_comments.filter(c => !recentComments.includes(c));
        const olderPositiveRatio = olderComments.length > 0
          ? olderComments.filter(c => c.rating >= 4).length / olderComments.length
          : 0;
          
        if (recentPositiveRatio > olderPositiveRatio + 0.15) {
          commentTrend = 'improving';
        } else if (recentPositiveRatio < olderPositiveRatio - 0.15) {
          commentTrend = 'declining';
        }
      }
      
      // Calculate empty comment ratio
      const emptyCommentRatio = 1 - commentsWithTextRatio;
      
      // Add insights based on comment analysis
      
      // High negative feedback
      if (negativeRatio >= 0.3) {
        result.push({
          id: 'negative-comments-high',
          title: 'High Volume of Negative Feedback',
          description: `${(negativeRatio * 100).toFixed(0)}% of recent customer comments are negative, indicating widespread service issues.`,
          severity: 'negative',
          metric: `${negativeComments} of ${totalComments}`,
          icon: <PeopleIcon />,
          recommendations: [
            'Conduct a detailed review of all negative comments to identify recurring themes',
            'Implement a service recovery program to address dissatisfied customers',
            'Increase manager presence during service hours for immediate issue resolution',
            'Follow up with dissatisfied customers to demonstrate commitment to improvement'
          ]
        });
      } 
      // Moderate negative feedback
      else if (negativeRatio >= 0.2 && negativeRatio < 0.3) {
        result.push({
          id: 'negative-comments-moderate',
          title: 'Concerning Level of Negative Feedback',
          description: `${(negativeRatio * 100).toFixed(0)}% of customer comments are negative, higher than the acceptable threshold.`,
          severity: 'warning',
          metric: `${negativeComments} of ${totalComments}`,
          icon: <WarningIcon />,
          recommendations: [
            'Analyse negative comments for specific pain points that could be addressed',
            'Implement targeted improvements in the most mentioned problem areas',
            'Provide staff with additional training on handling challenging situations',
            'Consider reaching out to customers who left negative feedback'
          ]
        });
      }
      
      // Strongly positive feedback
      if (positiveRatio >= 0.7) {
        result.push({
          id: 'positive-comments-high',
          title: 'Strong Customer Sentiment',
          description: `${(positiveRatio * 100).toFixed(0)}% of customer comments are positive, indicating excellent service quality.`,
          severity: 'positive',
          metric: `${positiveComments} of ${totalComments}`,
          icon: <SentimentSatisfiedAltIcon />,
          recommendations: [
            'Share positive feedback with the team to boost morale and reinforce good practices',
            'Analyse positive comments for specific aspects that customers appreciate most',
            'Create a recognition program for staff mentioned in positive feedback',
            'Incorporate successful approaches into training materials'
          ]
        });
      } 
      // Moderately positive feedback
      else if (positiveRatio >= 0.5 && positiveRatio < 0.7) {
        result.push({
          id: 'positive-comments-moderate',
          title: 'Good Customer Sentiment',
          description: `${(positiveRatio * 100).toFixed(0)}% of customer comments are positive, showing good but improvable service quality.`,
          severity: 'positive',
          metric: `${positiveComments} of ${totalComments}`,
          icon: <SentimentSatisfiedAltIcon />,
          recommendations: [
            'Share positive feedback with the team while highlighting areas for improvement',
            'Identify what distinguishes the very positive from the neutral experiences',
            'Set a target to increase positive feedback to 70%+',
            'Implement small service enhancements to elevate customer experience'
          ]
        });
      }
    }

    // INSIGHT GROUP 5: Overall Satisfaction Analysis
    if (satisfied_pct !== undefined) {
      const dissatisfied_pct_value = dissatisfied_pct || (100 - satisfied_pct - (neutral_pct || 0));
      
      // Add insights based on overall satisfaction levels
      if (satisfied_pct < 40) {
        // Critical satisfaction issue
        result.push({
          id: 'overall-satisfaction-critical',
          title: 'Critical Customer Satisfaction Issues',
          description: `Overall satisfaction rate of ${satisfied_pct}% indicates serious service quality concerns requiring immediate attention.`,
          severity: 'negative',
          metric: `${satisfied_pct}%`,
          icon: <ErrorOutlineIcon />,
          recommendations: [
            'Treat this as a business-critical issue requiring immediate leadership attention',
            'Implement a comprehensive service quality improvement program',
            'Consider bringing in external consultants to evaluate service processes',
            'Conduct in-depth customer satisfaction research to identify root causes'
          ]
        });
      } else if (satisfied_pct >= 40 && satisfied_pct < 60) {
        // Low satisfaction
        result.push({
          id: 'overall-satisfaction-low',
          title: 'Overall Satisfaction Needs Significant Improvement',
          description: `Overall satisfaction rate of ${satisfied_pct}% indicates substantial room for improvement in service quality.`,
          severity: 'negative',
          metric: `${satisfied_pct}%`,
          icon: <ErrorOutlineIcon />,
          recommendations: [
            'Develop a comprehensive service quality improvement plan',
            'Conduct detailed analysis of feedback in all categories',
            'Implement structured staff training focused on key satisfaction drivers',
            'Review service standards and procedures across all touchpoints'
          ]
        });
      } else if (satisfied_pct >= 60 && satisfied_pct < 75) {
        // Moderate satisfaction
        result.push({
          id: 'overall-satisfaction-moderate',
          title: 'Good but Improvable Satisfaction Levels',
          description: `Overall satisfaction rate of ${satisfied_pct}% indicates reasonably good service with clear opportunities for enhancement.`,
          severity: 'neutral',
          metric: `${satisfied_pct}%`,
          icon: <InfoIcon />,
          recommendations: [
            'Focus on specific service aspects that could elevate satisfaction to excellent levels',
            'Implement targeted improvements in categories with lower satisfaction scores',
            'Provide focused staff training in areas showing the most opportunity',
            'Consider service innovations to differentiate from competitors'
          ]
        });
      } else if (satisfied_pct >= 75 && satisfied_pct < 90) {
        // High satisfaction
        result.push({
          id: 'overall-satisfaction-high',
          title: 'Strong Overall Satisfaction',
          description: `Overall satisfaction rate of ${satisfied_pct}% indicates very good service quality across most categories.`,
          severity: 'positive',
          metric: `${satisfied_pct}%`,
          icon: <CheckCircleIcon />,
          recommendations: [
            'Maintain current service standards while looking for refinement opportunities',
            'Focus on consistency to ensure all customers receive the same high-quality experience',
            'Look for opportunities to turn satisfied customers into advocates',
            'Document successful service approaches for training and onboarding'
          ]
        });
      } else if (satisfied_pct >= 90) {
        // Excellent satisfaction
        result.push({
          id: 'overall-satisfaction-excellent',
          title: 'Exceptional Customer Satisfaction',
          description: `Overall satisfaction rate of ${satisfied_pct}% indicates industry-leading service quality.`,
          severity: 'positive',
          metric: `${satisfied_pct}%`,
          icon: <CheckCircleIcon />,
          recommendations: [
            'Document the service formula that has led to this exceptional result',
            'Consider developing case studies of your service excellence',
            'Leverage this exceptional rating in marketing and promotional materials',
            'Look for ways to maintain this high standard while optimising operations'
          ]
        });
      }
    }

    return result;
  }, [analyticsData, timeRange]);
  
  // Separate insights by severity for UI organisation
  const positiveInsights = insights.filter(i => i.severity === 'positive');
  const warningInsights = insights.filter(i => i.severity === 'warning');
  const negativeInsights = insights.filter(i => i.severity === 'negative');
  const neutralInsights = insights.filter(i => i.severity === 'neutral');

  // Format time range for display
  const timeRangeText = timeRange === 'week' ? 'the past week' : 
                        timeRange === 'month' ? 'the past month' : 
                        'the past year';

  // Component for empty state
  const noInsightsMessage = (
    <Paper 
      elevation={0}
      sx={{ 
        p: 4, 
        borderRadius: 3, 
        textAlign: 'center',
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
        border: '1px dashed',
        borderColor: alpha(theme.palette.primary.main, 0.2)
      }}
    >
      <SentimentSatisfiedAltIcon sx={{ fontSize: 60, color: alpha(theme.palette.primary.main, 0.5), mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        No Actionable Insights Available
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Based on the current data, there are no significant insights to highlight for {timeRangeText}.
        This could indicate stable performance or insufficient data for analysis.
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Try changing the time period or check back when more feedback data is available.
      </Typography>
    </Paper>
  );

  return (
    <Box>
      {/* Section header */}
      <Typography variant="h5" fontWeight="500" gutterBottom>
        Actionable Insights
      </Typography>
      <Typography variant="body1" paragraph color="text.secondary">
        Based on data analysis from {timeRangeText}, here are key insights and recommended actions.
      </Typography>

      {/* Main content - either insights or empty state */}
      {insights.length === 0 ? (
        noInsightsMessage
      ) : (
        <Grid container spacing={3}>
          {/* Priority Issues */}
          {negativeInsights.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: theme.palette.error.main, display: 'flex', alignItems: 'center' }}>
                <ErrorOutlineIcon sx={{ mr: 1 }} />
                Priority Issues
              </Typography>
              {negativeInsights.map(renderInsightCard)}
            </Grid>
          )}

          {/* Areas to Monitor */}
          {warningInsights.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: theme.palette.warning.main, display: 'flex', alignItems: 'center' }}>
                <WarningIcon sx={{ mr: 1 }} />
                Areas to Monitor
              </Typography>
              {warningInsights.map(renderInsightCard)}
            </Grid>
          )}

          {/* Positive Highlights */}
          {positiveInsights.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: theme.palette.success.main, display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon sx={{ mr: 1 }} />
                Positive Highlights
              </Typography>
              {positiveInsights.map(renderInsightCard)}
            </Grid>
          )}

          {/* Other Insights */}
          {neutralInsights.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: theme.palette.info.main, display: 'flex', alignItems: 'center' }}>
                <RecommendIcon sx={{ mr: 1 }} />
                Other Insights
              </Typography>
              {neutralInsights.map(renderInsightCard)}
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};
  
export default InsightsSection;