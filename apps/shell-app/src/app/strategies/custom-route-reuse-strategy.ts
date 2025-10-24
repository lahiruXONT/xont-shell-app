import {
  RouteReuseStrategy,
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
} from '@angular/router';
import { Injectable } from '@angular/core';
@Injectable()
export class CustomRouteReuseStrategy implements RouteReuseStrategy {
  private storedRoutes = new Map<string, DetachedRouteHandle>();
  private readonly MAX_STORED_ROUTES = 10;
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    // Only detach routes marked as reusable (tabs)
    return route.data?.['reusable'] === true;
  }
  store(
    route: ActivatedRouteSnapshot,
    handle: DetachedRouteHandle | null
  ): void {
    if (!handle) return;
    const path = this.getRoutePath(route);
    // Limit stored routes to prevent memory leaks
    if (this.storedRoutes.size >= this.MAX_STORED_ROUTES) {
      const firstKey = this.storedRoutes.keys().next().value;
      this.storedRoutes.delete(firstKey ?? '');
    }
    this.storedRoutes.set(path, handle);
  }
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const path = this.getRoutePath(route);
    return this.storedRoutes.has(path);
  }
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const path = this.getRoutePath(route);
    return this.storedRoutes.get(path) || null;
  }
  shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    curr: ActivatedRouteSnapshot
  ): boolean {
    return (
      future.routeConfig === curr.routeConfig &&
      JSON.stringify(future.params) === JSON.stringify(curr.params)
    );
  }
  // Clear specific route from cache
  clearRoute(path: string): void {
    this.storedRoutes.delete(path);
  }
  // Clear all cached routes
  clearAll(): void {
    this.storedRoutes.clear();
  }
  private getRoutePath(route: ActivatedRouteSnapshot): string {
    return (
      route.pathFromRoot
        .map((r) => r.url.map((segment) => segment.path).join('/'))
        .filter((path) => path)
        .join('/') + JSON.stringify(route.params)
    );
  }
}
