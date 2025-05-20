export enum QueryType {
  TASKS, // e.g., "What are my tasks today?"
  PROJECT_STATUS, // e.g., "What's the status of Project Apollo?"
  EMPLOYEE_TASKS, // e.g., "Show me tasks assigned to John"
  STATISTICS, // e.g., "How many tasks are in progress?"
  UNKNOWN,
}

export interface QueryAnalysis {
  type: QueryType;
  timeframe?: string;
  status?: string;
  projectName?: string;
  employeeName?: string;
}

export function analyzeQuery(query: string): QueryAnalysis {
  // Task-related queries
  if (query.includes("task") || query.includes("todo") || query.includes("to do")) {
    const analysis: QueryAnalysis = { type: QueryType.TASKS };

    // Check for timeframe
    if (query.includes("today")) {
      analysis.timeframe = "today";
    } else if (query.includes("this week")) {
      analysis.timeframe = "this week";
    } else if (query.includes("this month")) {
      analysis.timeframe = "this month";
    }

    // Check for status
    if (query.includes("in progress")) {
      analysis.status = "IN_PROGRESS";
    } else if (query.includes("done") || query.includes("completed")) {
      analysis.status = "DONE";
    } else if (query.includes("backlog")) {
      analysis.status = "BACKLOG";
    } else if (query.includes("review")) {
      analysis.status = "REVIEW";
    } else if (query.includes("todo") || query.includes("to do")) {
      analysis.status = "TODO";
    }

    return analysis;
  }

  // Project status queries
  const projectMatch =
    query.match(/project\s+(\w+)/i) || query.match(/status of\s+(\w+)/i) || query.match(/how is\s+(\w+)/i);
  if (projectMatch || query.includes("project status")) {
    return {
      type: QueryType.PROJECT_STATUS,
      projectName: projectMatch ? projectMatch[1] : "",
    };
  }

  // Employee task queries
  const employeeMatch =
    query.match(/tasks? (assigned to|for)\s+(\w+)/i) ||
    query.match(/what is\s+(\w+)\s+working on/i) ||
    query.match(/what('s| is)\s+(\w+)\s+doing/i);
  if (employeeMatch) {
    return {
      type: QueryType.EMPLOYEE_TASKS,
      employeeName: employeeMatch[employeeMatch.length - 1],
    };
  }

  // Statistics queries
  if (
    query.includes("statistics") ||
    query.includes("stats") ||
    query.includes("how many") ||
    query.includes("count")
  ) {
    return { type: QueryType.STATISTICS };
  }

  // Unknown query type
  return { type: QueryType.UNKNOWN };
}
