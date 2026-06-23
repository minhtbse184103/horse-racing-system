import { httpRequest } from '../api/httpClient';

export function getOurHubCourseInfo(date) {
  return httpRequest(`/api/admin/external-racing/ourhub/course-info/${date}`);
}
