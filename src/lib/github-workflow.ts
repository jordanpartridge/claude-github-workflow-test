import { Octokit } from '@octokit/rest';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

export class GitHubWorkflow {
  private octokit: Octokit;
  private config: WorkflowConfig;
  
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
    this.loadConfig();
  }

  async syncIssueState(issueNumber: number): Promise<void> {
    const issue = await this.getIssue(issueNumber);
    const branch = await this.getLinkedBranch(issueNumber);
    const pr = await this.getLinkedPR(branch);
    
    await this.updateLocalState({
      issue,
      branch,
      pr,
      lastSync: new Date().toISOString()
    });

    await this.updateIssueProgress(issueNumber);
  }

  private async getLinkedBranch(issueNumber: number): Promise<string | null> {
    const { data: branches } = await this.octokit.repos.listBranches({
      owner: this.config.owner,
      repo: this.config.repo
    });

    return branches.find(branch => 
      branch.name.includes(`${issueNumber}-`)
    )?.name || null;
  }
}
