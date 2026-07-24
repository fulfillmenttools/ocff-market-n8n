import type { IDataObject } from 'n8n-workflow';

/**
 * Reduce a routing plan response to the most useful fields, for the node's
 * "Simplify" option (a RoutingPlan carries far more than 10 fields).
 */
export function simplifyRoutingPlan(plan: IDataObject): IDataObject {
	return {
		id: plan.id,
		status: plan.status,
		orderRef: plan.orderRef,
		pickJobRef: plan.pickJobRef,
		processId: plan.processId,
		facilityRef: plan.facilityRef,
		priority: plan.priority,
		orderDate: plan.orderDate,
		provisioningTime: plan.provisioningTime,
		reRouteReason: plan.reRouteReason,
	};
}
