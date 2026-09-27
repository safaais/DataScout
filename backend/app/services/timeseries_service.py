# timeseries_service.py - مع Prophet و ARIMA
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional
from ..core.logger import logger

class TimeSeriesService:
    """Service for time series forecasting with Prophet and ARIMA"""
    
    @staticmethod
    def prepare_timeseries(df: pd.DataFrame, date_col: str, target_col: str) -> pd.Series:
        """Prepare time series data"""
        df_copy = df.copy()
        df_copy[date_col] = pd.to_datetime(df_copy[date_col], errors='coerce')
        df_copy = df_copy.dropna(subset=[date_col])
        df_copy = df_copy.sort_values(date_col)
        ts = df_copy.set_index(date_col)[target_col].dropna()
        return ts
    
    @staticmethod
    def forecast_prophet(df: pd.DataFrame, date_col: str, target_col: str, steps: int = 30) -> Dict[str, Any]:
        """Forecast using Prophet (Facebook)"""
        try:
            from prophet import Prophet
            
            # Prepare data for Prophet
            prophet_df = df.rename(columns={date_col: 'ds', target_col: 'y'})
            prophet_df['ds'] = pd.to_datetime(prophet_df['ds'])
            prophet_df = prophet_df.dropna(subset=['ds', 'y'])
            
            if len(prophet_df) < 10:
                return {'method': 'Prophet', 'error': 'Not enough data for Prophet (need at least 10 points)'}
            
            # Fit model
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                changepoint_prior_scale=0.05
            )
            model.fit(prophet_df)
            
            # Create future dataframe
            future = model.make_future_dataframe(periods=steps)
            
            # Forecast
            forecast = model.predict(future)
            
            # Extract forecast values
            forecast_values = forecast.tail(steps)['yhat'].values.tolist()
            forecast_dates = forecast.tail(steps)['ds'].dt.strftime('%Y-%m-%d').tolist()
            
            # Get components
            components = {
                'trend': forecast.tail(steps)['trend'].values.tolist(),
                'yearly': forecast.tail(steps)['yearly'].values.tolist() if 'yearly' in forecast.columns else None,
                'weekly': forecast.tail(steps)['weekly'].values.tolist() if 'weekly' in forecast.columns else None
            }
            
            # Calculate metrics on test data
            split_idx = int(len(prophet_df) * 0.8)
            if split_idx > 5 and split_idx < len(prophet_df) - 5:
                train_df = prophet_df.iloc[:split_idx]
                test_df = prophet_df.iloc[split_idx:]
                
                model_test = Prophet()
                model_test.fit(train_df)
                future_test = model_test.make_future_dataframe(periods=len(test_df))
                forecast_test = model_test.predict(future_test)
                
                y_true = test_df['y'].values
                y_pred = forecast_test.tail(len(test_df))['yhat'].values
                
                mae = np.mean(np.abs(y_true - y_pred))
                rmse = np.sqrt(np.mean((y_true - y_pred) ** 2))
                mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100 if np.all(y_true != 0) else 0
            else:
                mae = rmse = mape = 0
            
            logger.info(f"Prophet forecast completed for {steps} steps")
            
            return {
                'success': True,
                'method': 'Prophet',
                'forecast': forecast_values,
                'dates': forecast_dates,
                'components': components,
                'metrics': {
                    'mae': round(mae, 2),
                    'rmse': round(rmse, 2),
                    'mape': round(mape, 2)
                },
                'data_points': len(prophet_df)
            }
            
        except Exception as e:
            logger.error(f"Prophet forecast failed: {str(e)}")
            return {'success': False, 'method': 'Prophet', 'error': str(e)}
    
    @staticmethod
    def forecast_arima(ts: pd.Series, steps: int = 30) -> Dict[str, Any]:
        """Forecast using ARIMA model"""
        try:
            from statsmodels.tsa.arima.model import ARIMA
            from statsmodels.tsa.stattools import adfuller
            
            # Check if data is stationary
            ts_clean = ts.dropna()
            if len(ts_clean) < 10:
                return {'success': False, 'method': 'ARIMA', 'error': 'Not enough data for ARIMA (need at least 10 points)'}
            
            # Auto-detect differencing order (d)
            try:
                result = adfuller(ts_clean)
                d = 1 if result[1] > 0.05 else 0
            except:
                d = 1
            
            # Fit ARIMA model
            model = ARIMA(ts_clean, order=(5, d, 0))
            fitted = model.fit()
            
            # Forecast
            forecast = fitted.forecast(steps=steps)
            forecast_values = forecast.values.tolist()
            
            # Get forecast dates
            last_date = ts_clean.index[-1]
            forecast_dates = pd.date_range(start=last_date, periods=steps + 1, freq='D')[1:]
            
            # Calculate metrics on test data
            split_idx = int(len(ts_clean) * 0.8)
            if split_idx > 5 and split_idx < len(ts_clean) - 5:
                train_ts = ts_clean[:split_idx]
                test_ts = ts_clean[split_idx:]
                
                model_test = ARIMA(train_ts, order=(5, d, 0))
                fitted_test = model_test.fit()
                test_forecast = fitted_test.forecast(steps=len(test_ts))
                
                y_true = test_ts.values
                y_pred = test_forecast.values
                
                mae = np.mean(np.abs(y_true - y_pred))
                rmse = np.sqrt(np.mean((y_true - y_pred) ** 2))
                mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100 if np.all(y_true != 0) else 0
            else:
                mae = rmse = mape = 0
            
            logger.info(f"ARIMA forecast completed for {steps} steps")
            
            return {
                'success': True,
                'method': 'ARIMA',
                'forecast': forecast_values,
                'dates': [d.strftime('%Y-%m-%d') for d in forecast_dates],
                'metrics': {
                    'mae': round(mae, 2),
                    'rmse': round(rmse, 2),
                    'mape': round(mape, 2)
                },
                'data_points': len(ts_clean),
                'order': (5, d, 0),
                'aic': round(fitted.aic, 2) if hasattr(fitted, 'aic') else None
            }
            
        except Exception as e:
            logger.error(f"ARIMA forecast failed: {str(e)}")
            return {'success': False, 'method': 'ARIMA', 'error': str(e)}
    
    @staticmethod
    def forecast_simple_moving_average(ts: pd.Series, steps: int = 30, window: int = 7) -> Dict[str, Any]:
        """Simple moving average forecast"""
        try:
            ts_clean = ts.dropna()
            if len(ts_clean) < window:
                window = max(1, len(ts_clean) // 2)
            
            ma = ts_clean.rolling(window=window, min_periods=1).mean()
            last_ma = ma.iloc[-1]
            
            # Calculate trend
            if len(ts_clean) > window * 2:
                trend = (ts_clean.iloc[-1] - ts_clean.iloc[-window]) / window
            else:
                trend = 0
            
            forecast_values = [last_ma + trend * (i + 1) for i in range(steps)]
            
            last_date = ts_clean.index[-1]
            forecast_dates = pd.date_range(start=last_date, periods=steps + 1, freq='D')[1:]
            
            # Calculate metrics
            split_idx = int(len(ts_clean) * 0.8)
            if split_idx > window and split_idx < len(ts_clean) - window:
                train_ts = ts_clean[:split_idx]
                test_ts = ts_clean[split_idx:]
                
                train_ma = train_ts.rolling(window=window, min_periods=1).mean()
                last_train_ma = train_ma.iloc[-1]
                train_trend = (train_ts.iloc[-1] - train_ts.iloc[-window]) / window if len(train_ts) >= window else 0
                
                test_forecast = [last_train_ma + train_trend * (i + 1) for i in range(len(test_ts))]
                
                y_true = test_ts.values
                y_pred = np.array(test_forecast)
                
                mae = np.mean(np.abs(y_true - y_pred))
                rmse = np.sqrt(np.mean((y_true - y_pred) ** 2))
                mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100 if np.all(y_true != 0) else 0
            else:
                mae = rmse = mape = 0
            
            return {
                'success': True,
                'method': 'Simple Moving Average',
                'window': window,
                'forecast': forecast_values,
                'dates': [d.strftime('%Y-%m-%d') for d in forecast_dates],
                'metrics': {
                    'mae': round(mae, 2),
                    'rmse': round(rmse, 2),
                    'mape': round(mape, 2)
                },
                'trend': float(trend),
                'last_value': float(ts_clean.iloc[-1])
            }
            
        except Exception as e:
            logger.error(f"SMA forecast failed: {str(e)}")
            return {'success': False, 'method': 'Simple Moving Average', 'error': str(e)}