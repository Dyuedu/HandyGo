import { useQuery } from '@tanstack/react-query'
import { getMatchingJobs } from '../services/matchingService'

export function useJobs(params) {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: () => getMatchingJobs(params),
    enabled: false,
  })
}
