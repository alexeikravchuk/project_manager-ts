/// <reference path="drag-drop-interfaces.ts" />
/// <reference path="project-model.ts" />

namespace App {
  function autobind(_target: any, _methodName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const adjDescritor: PropertyDescriptor = {
      configurable: true,
      get() {
        const boundFn = originalMethod.bind(this);
        return boundFn;
      },
    };
    return adjDescritor;
  }

  const uid = (() => {
    let n = 0;
    return () => Date.now() + n++;
  })();

  // Project State Management
  type Listener<T> = (items: T[]) => void;

  class State<T> {
    protected listeners: Listener<T>[] = [];

    addListener(listenerFn: Listener<T>) {
      this.listeners.push(listenerFn);
    }
  }

  class ProjectState extends State<Project> {
    private projects: Project[] = [];
    private static instance: ProjectState;

    private constructor() {
      super();
    }

    static getInstance() {
      if (this.instance) {
        return this.instance;
      }

      this.instance = new ProjectState();
      return this.instance;
    }

    addProject(title: string, description: string, people: number) {
      const id = uid().toString();
      const newProject = new Project(id, title, description, people, ProjectStatus.Active);
      this.projects.push(newProject);

      this.updateListeners();
    }

    moveProject(projectId: string, newStatus: ProjectStatus) {
      const project = this.projects.find((prj) => prj.id === projectId);
      if (project && project.status !== newStatus) {
        project.status = newStatus;
        this.updateListeners();
      }
    }

    private updateListeners() {
      for (const listenerFn of this.listeners) {
        listenerFn(this.projects.slice());
      }
    }
  }

  const projectState = ProjectState.getInstance();

  //Validation
  interface Validatable {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  }

  function validate(validatableInput: Validatable) {
    const { value, required, minLength, maxLength, min, max } = validatableInput;

    if (required) {
      if (value.toString().trim().length === 0) return false;
    }

    if (minLength != null && typeof value === 'string') {
      if (value.length < minLength) return false;
    }

    if (maxLength != null && typeof value === 'string') {
      if (value.length > maxLength) return false;
    }

    if (min != null && typeof value === 'number') {
      if (value < min) return false;
    }

    if (max != null && typeof value === 'number') {
      if (value > max) return false;
    }

    return true;
  }

  // Comonent base class
  abstract class Component<T extends HTMLElement, U extends HTMLElement> {
    templateElement: HTMLTemplateElement;
    hostElement: T;
    element: U;

    constructor(templateId: string, hostElementId: string, insertAtStart: boolean, newElementId?: string) {
      this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
      this.hostElement = document.getElementById(hostElementId)! as T;
      const importedNode = document.importNode(this.templateElement.content, true);

      this.element = importedNode.firstElementChild as U;

      if (newElementId) {
        this.element.id = newElementId;
      }

      this.attach(insertAtStart);
    }

    private attach(insertAtBeginning: boolean) {
      const position = insertAtBeginning ? 'afterbegin' : 'beforeend';
      this.hostElement.insertAdjacentElement(position, this.element);
    }

    abstract configure(): void;
    abstract renderContent(): void;
  }

  // ProjectItem class
  class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements Draggable {
    private project: Project;

    get persons() {
      const { people } = this.project;

      if (people === 1) {
        return '1 person';
      }

      return `${people} persons`;
    }

    constructor(hostId: string, project: Project) {
      super('single-project', hostId, false, project.id);
      this.project = project;

      this.configure();
      this.renderContent();
    }

    @autobind
    dragStartHandler(event: DragEvent): void {
      event.dataTransfer!.setData('text/plain', this.project.id);
      event.dataTransfer!.effectAllowed = 'move';
    }

    // @autobind
    dragEndHandler(_event: DragEvent): void {
      console.log('DragEnd');
    }

    configure(): void {
      this.element.addEventListener('dragstart', this.dragStartHandler);
      this.element.addEventListener('dragend', this.dragEndHandler);
    }

    renderContent(): void {
      this.element.querySelector('h2')!.textContent = this.project.title;
      this.element.querySelector('h3')!.textContent = this.persons + ' assigned.';
      this.element.querySelector('p')!.textContent = this.project.description;
    }
  }

  // ProjectList class
  class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget {
    assignedProjects: Project[] = [];

    constructor(private type: 'active' | 'finished') {
      super('project-list', 'app', false, `${type}-projects`);

      this.configure();
      this.renderContent();
    }

    @autobind
    dragLeaveHandler(_event: DragEvent): void {
      const listEl = this.element.querySelector('ul')!;
      listEl.classList.remove('droppable');
    }

    @autobind
    dragOverHandler(event: DragEvent): void {
      if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
        event.preventDefault();
        const listEl = this.element.querySelector('ul')!;
        listEl.classList.add('droppable');
      }
    }

    @autobind
    dropHandler(event: DragEvent): void {
      const listEl = this.element.querySelector('ul')!;
      listEl.classList.remove('droppable');

      const id = event.dataTransfer?.getData('text/plain');
      id && projectState.moveProject(id, this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished);
    }

    configure() {
      this.element.addEventListener('dragover', this.dragOverHandler);
      this.element.addEventListener('dragleave', this.dragLeaveHandler);
      this.element.addEventListener('drop', this.dropHandler);

      projectState.addListener((projects: Project[]) => {
        const relevantProjects = projects.filter((prj) => {
          if (this.type === 'active') {
            return prj.status === ProjectStatus.Active;
          }

          return prj.status === ProjectStatus.Finished;
        });
        this.assignedProjects = relevantProjects;
        this.renderProjects();
      });
    }

    renderContent() {
      const listId = `${this.type}-project-list`;
      this.element.querySelector('ul')!.id = listId;
      this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' PROJECTS';
    }

    private renderProjects() {
      const listEl = document.getElementById(`${this.type}-project-list`)! as HTMLUListElement;

      listEl.innerHTML = '';

      for (const prjItem of this.assignedProjects) {
        new ProjectItem(this.element.querySelector('ul')!.id, prjItem);
      }
    }
  }

  // ProjectInput class
  class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

    constructor() {
      super('project-input', 'app', true, 'user-input');

      this.titleInputElement = this.element.querySelector('#title')!;
      this.descriptionInputElement = this.element.querySelector('#description')!;
      this.peopleInputElement = this.element.querySelector('#people')!;

      this.configure();
    }

    configure() {
      this.element.addEventListener('submit', this.submiteHandler);
    }

    renderContent(): void {}

    gatherUserInput(): [string, string, number] | void {
      const enteredTitle = this.titleInputElement.value;
      const enteredDescription = this.descriptionInputElement.value;
      const enteredPeople = this.peopleInputElement.value;

      const titleValidatable: Validatable = {
        value: enteredTitle,
        required: true,
      };
      const descriptionValidatable: Validatable = {
        value: enteredDescription,
        required: true,
        minLength: 5,
      };
      const peopleValidatable: Validatable = {
        value: +enteredPeople,
        required: true,
        min: 1,
        max: 5,
      };

      if (!validate(titleValidatable) || !validate(descriptionValidatable) || !validate(peopleValidatable)) {
        alert('Invalid input! please try again!');
        return;
      } else {
        return [enteredTitle, enteredDescription, +enteredPeople];
      }
    }

    private cleareInputs() {
      this.titleInputElement.value = '';
      this.descriptionInputElement.value = '';
      this.peopleInputElement.value = '';
    }

    @autobind
    private submiteHandler(event: Event) {
      event.preventDefault();
      const userInput = this.gatherUserInput();
      if (Array.isArray(userInput)) {
        const [title, description, people] = userInput;
        projectState.addProject(title, description, people);
        this.cleareInputs();
      }
    }
  }

  new ProjectInput();
  new ProjectList('active');
  new ProjectList('finished');
}
