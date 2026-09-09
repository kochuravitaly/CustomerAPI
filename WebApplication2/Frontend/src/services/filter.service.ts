import { apiService } from './api';
import { FilterOptionsDto } from '../types/filter';

export const filterService = {
    getOptions: () =>
        apiService.get<FilterOptionsDto>('/filters/options'),
};