import { ReactNode } from 'react';
import { ButtonProps, BadgeProps, ContainerProps, ChipProps, PaperProps, createTheme, TextFieldProps as MuiTextFieldProps } from '@mui/material';

export interface DetailCardProps {
  title: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  subtitleIcon?: ReactNode;
  headerColor?: string;
}

export interface ActionButtonProps extends ButtonProps {
  children: ReactNode;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  elevated?: boolean;
}

export interface Props {
    children: ReactNode;
}
  
export interface State {
    hasError: boolean;
    error: Error | null;
}

export interface ErrorDisplayProps {
    error: string;
    onRetry?: () => void;
}

export interface IconBadgeProps extends Omit<BadgeProps, 'children'> {
  icon: React.ReactNode;
  badgeContent?: React.ReactNode;
}

export interface InfoItemProps {
    icon: ReactNode;
    label: string;
    value: ReactNode;
}

export interface LoadingIndicatorProps {
    open: boolean;
}

export interface LoadingOverlayProps {
    message?: string;
    transparent?: boolean;
}

export interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: ContainerProps['maxWidth'];
  centerContent?: boolean;
}

export interface PageHeaderProps {
    title: string;
    backUrl?: string;
    onBack?: () => void;
}

export interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: string;
  size?: 'small' | 'medium';
}

export interface StyledButtonProps extends ButtonProps {
  children: React.ReactNode;
  hoverAnimation?: boolean;
}

export interface StyledCardProps extends PaperProps {
  children: React.ReactNode;
  hoverEffect?: boolean;
}

export interface TimeProgressProps {
    remainingTime: string | number;
    progressPercentage: number;
}

export interface FormContainerProps {
  title: string;
  children: React.ReactNode;
  error?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  theme?: ReturnType<typeof createTheme>;
}

export interface EmptyStateProps {
    message: string;
    buttonText?: string;
    buttonAction?: () => void;
}

export type FormTextFieldProps = MuiTextFieldProps & {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
};

export interface HeroSectionProps {
    displayText: string;
    fadeIn: boolean;
}

export interface MainLayoutProps {
  children?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface LoadingSkeletonProps {
    variant?: 'detail' | 'list' | 'card';
}

export interface PrivateRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}